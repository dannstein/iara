# IARA API — Handout para o Frontend

Documento de contrato da API. Cobre **todos os endpoints implementados**, com método, caminho,
perfil de acesso, corpo da requisição e formato da resposta. O backend está 100% implementado e
testado contra PostgreSQL+PostGIS, Redis e RabbitMQ.

---

## 1. Fundamentos

- **Base URL:** `http://localhost:8080/api`
- **Formato:** JSON em tudo, exceto uploads (multipart/form-data, indicados explicitamente).
- **Autenticação:** JWT Bearer. Envie `Authorization: Bearer <accessToken>` em todos os endpoints,
  exceto os marcados com 🔓.
- **Access token** dura 15 min; renove com `/auth/refresh` usando o `refreshToken` (dura 7 dias, rotacionado a cada uso).

### Resposta de login (TokenResponse)
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid-string",
  "tokenType": "Bearer",
  "accessExpiresAt": 1779397381000,
  "userId": "uuid",
  "email": "user@example.com",
  "role": "DOADOR"
}
```

### Formato de erro (todos os erros)
```json
{
  "timestamp": "2026-05-22T00:00:00Z",
  "status": 422,
  "erro": "VALIDACAO_NEGOCIO",
  "mensagem": "RN14: paciente que não respira deve ser classificado como PRETO",
  "path": "/api/eventos/uuid/triagem"
}
```
Erros de validação de formato (Bean Validation) incluem também `"campos": { "campo": "mensagem" }`.
Conflito com flag extra (ex.: abrigo lotado prioritário) inclui `"priority_blocked": true`.

### Códigos HTTP
| Código | Quando |
|--------|--------|
| 200 | GET/PUT/PATCH ok |
| 201 | POST criou recurso |
| 202 | Cadastro técnico aceito (pendente) |
| 204 | DELETE ok |
| 400 | Formato inválido (validação de campo) |
| 401 | Token ausente/expirado/credenciais inválidas |
| 403 | Perfil insuficiente |
| 404 | Não encontrado |
| 409 | Conflito de negócio (lotado, duplicado, pré-condição) |
| 422 | Violação de regra de negócio (RN14, RN17, RN23, RN26, XOR, etc.) |
| 429 | Rate limit no login |

### Perfis e hierarquia
`ADMIN > GESTOR > MONITOR > COORDENADOR > TECNICO/DOADOR` (+ `USUARIO_SIMPLES` para cidadão).
Perfis superiores herdam o acesso dos inferiores. Quando um endpoint exige "MONITOR", um GESTOR/ADMIN
também pode chamá-lo. `COORDENADOR` herda TECNICO e DOADOR.

### Multi-tenant
Todo dado é filtrado pelo tenant do usuário autenticado: MUNICIPAL vê o próprio; ESTADUAL vê os
municípios filhos; FEDERAL vê tudo. O frontend não precisa enviar tenant nos GETs — é automático.
**Exceção por perfil:** usuário com role **ADMIN** enxerga e acessa **todos os tenants**,
independentemente do tenant ao qual está vinculado (override de visibilidade por papel, não por
tipo de tenant).

**Tenant ativo (foco):** usuários multi-tenant (FEDERAL/ESTADUAL/ADMIN) podem focar em um único
tenant enviando o header opcional **`X-Active-Tenant: <uuid>`** em qualquer request. Quando presente
e dentro do escopo do usuário, as **listagens** passam a retornar apenas aquele tenant e seus
descendentes (eventos, abrigos, PCs, dashboards, etc.). Omitir o header (ou enviar vazio) volta ao
escopo completo. Acesso direto a um recurso por id e a navegação de tenants não são afetados pelo
filtro. Tenant fora do escopo no header é ignorado.

### Convenções de geometria
- **Ponto** em requests/responses: `"coordenadas": { "lat": -23.5, "lng": -46.6 }` (objeto `CoordenadasDTO`).
- **Polígono / área**: GeoJSON, ex.:
  `{ "type": "Polygon", "coordinates": [[[lng,lat],[lng,lat],...]] }`.
- Endereços de Ponto de Atenção e Solicitação de Serviço são **geocodificados no backend** (envie só o texto).

### Valores de enum (CHECK no banco)
- evento.severidade: `BAIXA | MEDIA | ALTA | CRITICA`
- evento.status: `SOLICITADO | ATIVO | ALERTA_CRITICO | ENCERRADO | CANCELADO`
- evento.fideStatus: `NAO_INICIADO | EM_PREENCHIMENTO | SUBMETIDO | APROVADO | REJEITADO`
- triagem.classificacao: `VERMELHO | AMARELO | VERDE | PRETO`
- setor.tipo: `QUENTE | MORNA | FRIA`
- pc.pcTipo: `FIXO | TEMPORARIO`
- demanda.prioridade: `CRITICA | ALTA | MEDIA | BAIXA | SUPRIDA`
- pcEvento.status: `NOTIFICADO | ACEITO | RECUSADO`
- helper.status: `PENDENTE | CONFIRMADO | RECUSADO` ; iniciadoPor: `COORDENADOR | VOLUNTARIO`
- doacao.status: `PENDENTE | CONFIRMADA | CANCELADA | EXPIRADA`
- hospital.tipo: `PUBLICO | PRIVADO | MISTO | CAMPANHA`
- infra.tipo: `SECRETARIA_SAUDE | SECRETARIA_ASSISTENCIA | CENTRO_TRIAGEM | POSTO_AVANCADO | CENTRO_COMANDO | OUTRO`
- recurso.status: `DISPONIVEL | EM_OPERACAO | MANUTENCAO | INDISPONIVEL`
- abastecimento.tipo: `COMBUSTIVEL | KIT_HUMANITARIO | MISTO`
- zonaRisco.tipo: `ENCHENTE | DESLIZAMENTO | INCENDIO | MULTIPERIGO | OUTRO` ; nivelRisco 1..5
- pontoAtencao.situacaoApoio: `SEM_APOIO | COM_APOIO`
- estacao.fonte: `CEMADEN | INMET | DC_PROPRIA | OUTRO` ; tipo: `PLUVIOMETRO | HIDROMETRO | TERMOMETRO | MULTIPLO`
- solicitacaoServico.tipo: `CORTE_ARVORE | VISTORIA_RACHADURA | LIMPEZA_BUEIRO | RISCO_DESLIZAMENTO | OUTRO`
- solicitacaoServico.status: `ABERTA | EM_TRIAGEM | EM_ATENDIMENTO | CONCLUIDA | INDEFERIDA`
- notificacao.tipo: `EVENTO | DEMANDA | ALERTA | PC | METEOROLOGICO | SISTEMA`

### Seed inicial (já existe no banco)
- Tenant FEDERAL: `00000000-0000-0000-0000-000000000001`
- Roles: DOADOR, TECNICO, COORDENADOR, MONITOR, GESTOR, ADMIN, USUARIO_SIMPLES
- Lookups pré-cadastrados: 9 tipos de desastre (COBRADE), 6 tipos de demanda, 8 tipos de recurso, 6 tipos de alerta, 6 categorias de especialidade + subcategorias.

---

## 2. Autenticação 🔓

| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/auth/mobile/login` | `{ "email", "senha" }` | TokenResponse |
| POST | `/auth/web/login` | `{ "email", "senha" }` | TokenResponse (rejeita USUARIO_SIMPLES → 403) |
| POST | `/auth/mobile/register` | `{ "nome","email","telefone","documento","senha","tenantId","roleNome" }` | TokenResponse 201 |
| POST | `/auth/web/register` | idem (roleNome ex.: `GESTOR`) | TokenResponse 201 |
| POST | `/auth/refresh` | `{ "refreshToken" }` | TokenResponse |
| POST | `/auth/logout` | `{ "accessToken", "refreshToken" }` | 200 |
| GET | `/health` | — | 200 |

---

## 3. Usuários

Cadastro 🔓 (público). Os de aprovação automática (doador/simples/coordenador) retornam **TokenResponse** (já logado). Técnico retorna **UsuarioDTO** com 202 (pendente).

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/usuarios/cadastro/doador` | 🔓 | `{ "nome","email","telefone","documento","senha","tenantId" }` | TokenResponse 201 |
| POST | `/usuarios/cadastro/simples` | 🔓 | idem | TokenResponse 201 |
| POST | `/usuarios/cadastro/coordenador` | 🔓 | idem | TokenResponse 201 |
| POST | `/usuarios/cadastro/tecnico` | 🔓 | **multipart**: `nome, email, telefone, documento, senha, tenantId, idEspec, docComprovacaoNumero, doc_comprovacao (arquivo)` | UsuarioDTO 202. RN24: faltando idEspec/docComprovacaoNumero/arquivo → 422 |
| GET | `/usuarios/me` | 👤 | — | UsuarioDTO |
| PUT | `/usuarios/me` | 👤 | `{ "nome?","telefone?","fotoUrl?","localizacao?":{lat,lng}, "endereco?":{cep,logradouro,numero,complemento,bairro,cidade,uf,coordenadas:{lat,lng}} }` | UsuarioDTO |
| PATCH | `/usuarios/me/disponibilidade?disponivel=true` | TECNICO | query `disponivel` opcional (omitido = alterna) | UsuarioDTO |
| GET | `/usuarios/pendentes` | GESTOR | — | UsuarioDTO[] |
| GET | `/usuarios/{id}` | GESTOR | — | UsuarioDTO |
| GET | `/usuarios?role=&status=&especialidade=` | GESTOR | filtros opcionais (role, status, especialidade=uuid) | UsuarioDTO[] |
| POST | `/usuarios` | GESTOR | `{ "nome","email","telefone?","documento","senha","tenantId","roleNome" }` | UsuarioDTO 201. Conta criada APROVADA. Sem escalonamento: perfil ≤ perfil do criador (só ADMIN cria ADMIN); tenant deve estar no escopo do criador (senão 403) |
| PATCH | `/usuarios/{id}/role` | ADMIN | `{ "roleNome" }` | UsuarioDTO (altera o perfil; alvo deve estar no escopo) |
| GET | `/usuarios/{id}/eventos-atendidos` | GESTOR | — | AtendimentoDTO[] `{ eventoId, eventoTitulo, severidade, checkins, triagens, primeiroCheckin, ultimoCheckout }` (eventos onde o usuário fez check-in ou triagem) |
| PATCH | `/usuarios/{id}/aprovar` | GESTOR | — | UsuarioDTO |
| PATCH | `/usuarios/{id}/rejeitar` | GESTOR | `{ "motivo" }` | UsuarioDTO |
| PATCH | `/usuarios/{id}/bloquear` | ADMIN | — | UsuarioDTO |

**UsuarioDTO:** `{ id, nome, email, telefone, documento, role, tenantId, especId, cadastroSts, estaDisponivel, fotoUrl, docComprovacaoNumero, docComprovacaoUrl, createdAt }`

---

## 4. Especialidades

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| GET | `/especialidades/categorias` | 👤 | — | CategoriaDTO[] (sem subcategorias) |
| GET | `/especialidades/categorias/{id}` | 👤 | — | CategoriaDTO (com `subcategorias[]`) |
| POST | `/especialidades/categorias` | GESTOR | `{ "nome","descricao?" }` | CategoriaDTO 201 |
| GET | `/especialidades?id_categoria=` | 👤 | filtro opcional | EspecDTO[] |
| POST | `/especialidades` | GESTOR | `{ "idCategoria","nome","descricao?" }` | EspecDTO 201 |

**CategoriaDTO:** `{ id, nome, descricao, idTenant, subcategorias:[EspecDTO]|null }`
**EspecDTO:** `{ id, idCategoria, nome, descricao, idTenant }` (idTenant null = global)

---

## 5. Tenants

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| GET | `/tenants` | GESTOR | — | TenantDTO[] (filhos do tenant atual) |
| GET | `/tenants/hierarquia` | GESTOR | — | TenantNodeDTO (árvore enraizada no tenant do usuário; **ADMIN** recebe a árvore inteira a partir da raiz FEDERAL) |
| GET | `/tenants/{id}` | GESTOR | — | TenantDTO (403 se fora do escopo; **ADMIN** acessa qualquer um) |
| POST | `/tenants` | GESTOR | `{ "nome","tipo","uf","ibgeCod?","idPai" }` | TenantDTO 201. Cria tenant **abaixo** do FEDERAL. Regras: tipo ∈ ESTADUAL/MUNICIPAL (FEDERAL proibido); ESTADUAL exige pai FEDERAL, MUNICIPAL exige pai ESTADUAL + `ibgeCod`. Escopo do criador: **ADMIN**/gestor **FEDERAL** criam estados e municípios; gestor **ESTADUAL** cria apenas municípios sob o próprio estado; gestor **MUNICIPAL** não cria (403). |
| PUT | `/tenants/{id}` | ADMIN | `{ "nome","uf?","ibgeCod?","isActive?" }` | TenantDTO |

**TenantDTO:** `{ id, nome, tipo, uf, ibgeCod, idPai, isActive }`
**TenantNodeDTO:** `{ id, nome, tipo, uf, filhos:[TenantNodeDTO] }`

---

## 6. Eventos

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos` | TECNICO | `{ "titulo","descricao?","idTipo","severidade","coordenadas":{lat,lng},"raioMetros?","areaRisco?":GeoJSON,"cobradeCod?","isSimulado?" }` | EventoDTO 201 (status SOLICITADO) |
| GET | `/eventos?status=&severidade=&tipo=&is_simulado=` | 👤 | filtros opcionais | EventoDTO[] |
| GET | `/eventos/{id}` | 👤 | — | EventoDTO |
| PUT | `/eventos/{id}` | MONITOR | `{ "titulo?","descricao?","severidade?","raioMetros?","areaRisco?" }` | EventoDTO |
| PATCH | `/eventos/{id}/aprovar` | GESTOR | — | EventoDTO (→ ATIVO; notifica PCs+técnicos próximos) |
| PATCH | `/eventos/{id}/status` | GESTOR | `{ "status","observacao?" }` (ATIVO/ALERTA_CRITICO/ENCERRADO) | EventoDTO |
| PATCH | `/eventos/{id}/cancelar` | GESTOR | `{ "observacao?" }` | EventoDTO (só de SOLICITADO) |
| DELETE | `/eventos/{id}` | ADMIN | — | 204 (só CANCELADO/SOLICITADO) |

**EventoDTO:** `{ id, tenantId, titulo, descricao, idTipo, tipoNome, status, severidade, solicitanteId, aprovadorId, coordenadas:{lat,lng}, raioMetros, areaRisco:GeoJSON|null, isSimulado, cobradeCod, fideStatus, upvotes, dataSolicitacao, dataAprovacao }`

### 6.1 FIDE / S2ID (GESTOR)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| GET | `/eventos/{id}/fide` | — | FideDTO |
| PUT | `/eventos/{id}/fide` | `{ municipioAfetado, decretoMunicipal, dataDecreto, popAfetada, danosMateriais, acoesResposta, recursosSolicitados, prejuizoPublico, prejuizoPrivado, danosHumanosDesc }` (todos opcionais) | FideDTO |
| GET | `/eventos/{id}/fide/validar` | — | `{ "pronto": bool, "motivoBloqueio": string|null }` |
| PATCH | `/eventos/{id}/fide/submeter` | — | FideDTO (422 se não pronto — RN17) |

**FideDTO:** `{ cobradeCod, municipioAfetado, decretoMunicipal, dataDecreto, popAfetada, danosMateriais, acoesResposta, recursosSolicitados, prejuizoPublico, prejuizoPrivado, danosHumanosDesc, fideStatus }`

### 6.2 Upvotes / Histórico / Avaliação
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos/{id}/upvote` | TECNICO | — | `{ "upvotes": n }` (409 se duplicado) |
| DELETE | `/eventos/{id}/upvote` | TECNICO | — | `{ "upvotes": n }` |
| GET | `/eventos/{id}/historico` | MONITOR | — | HistoricoDTO[] `{ id, statusDe, statusPara, responsavelId, observacao, createdAt }` |
| GET | `/eventos/{id}/pontos-coleta?status=ACEITO` | MONITOR | — | PcDTO[] (PCs vinculados ao evento com o status; padrão ACEITO — os que aceitaram ajudar) |
| POST | `/eventos/{id}/avaliacao` | COORDENADOR | `{ "nota":1-5,"pontosPositivos?","pontosMelhoria?" }` | AvaliacaoDTO 201 (409 se já avaliou) |
| GET | `/eventos/{id}/avaliacao` | GESTOR | — | AvaliacaoDTO[] |

### 6.3 Especialidades necessárias / Match
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos/{id}/especialidades` | GESTOR | `{ "idEspec","qtdNecessaria" }` | EspecNecessariaDTO 201 |
| GET | `/eventos/{id}/especialidades` | MONITOR | — | EspecNecessariaDTO[] `{ id, idEspec, especNome, qtdNecessaria, qtdAlocada }` |
| PUT | `/eventos/{id}/especialidades/{especId}` | GESTOR | `{ "idEspec","qtdNecessaria" }` | EspecNecessariaDTO |
| DELETE | `/eventos/{id}/especialidades/{especId}` | GESTOR | — | 204 |
| GET | `/eventos/{id}/tecnicos-disponiveis?id_espec=&raio_metros=` | GESTOR | filtros opcionais | TecnicoDisponivelDTO[] `{ id, nome, telefone, especId, especNome, localizacao:{lat,lng} }` |

### 6.4 Check-in (TECNICO) — RN19
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/eventos/{id}/checkin` | `{ "coordenadas":{lat,lng}, "dataSincronizacao?" }` | CheckinDTO 201 (403 se zona QUENTE e técnico não-segurança) |
| PATCH | `/eventos/{id}/checkout` | — | CheckinDTO |
| GET | `/eventos/{id}/checkins` | (MONITOR) | CheckinDTO[] |

**CheckinDTO:** `{ id, eventoId, usuarioId, coordenadas, dataCheckin, dataCheckout }`

### 6.5 Incidentes (MONITOR)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/eventos/{id}/incidentes` | `{ mortos?, feridos?, desabrigados?, desaparecidos?, startVermelho?, startAmarelo?, startVerde?, startPreto? }` (inteiros ≥0) | IncidentesDTO 201 (cria novo registro — histórico) |
| GET | `/eventos/{id}/incidentes` | — | IncidentesDTO[] (histórico) |
| GET | `/eventos/{id}/incidentes/atual` | — | IncidentesDTO (mais recente) |

### 6.6 Triagem START — RN13/RN14
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos/{id}/triagem` | TECNICO | `{ "codigoCampo","nomeProvisorio?","idadeEstimada?","classificacao","respiraAposAbertura?","coordenadas?":{lat,lng},"idSetor?","dataSincronizacao?" }` | TriagemDTO 201. RN14: respiraAposAbertura=false e classificacao≠PRETO → 422 |
| GET | `/eventos/{id}/triagem` | MONITOR | — | TriagemDTO[] (estado atual por código) |
| GET | `/eventos/{id}/triagem/{codigoCampo}` | MONITOR | — | TriagemDTO[] (histórico de reavaliações) |

**TriagemDTO:** `{ id, codigoCampo, nomeProvisorio, idadeEstimada, classificacao, respiraAposAbertura, localEncontrado:{lat,lng}, setorId, triadorId, createdAt }`

### 6.7 Setores (RN19)
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos/{id}/setores` | MONITOR | `{ "tipo":"QUENTE|MORNA|FRIA","geometria":GeoJSON,"descricao?" }` | SetorDTO 201 |
| GET | `/eventos/{id}/setores` | 👤 | — | SetorDTO[] |
| GET | `/eventos/{id}/setores/verificar?lat=&lng=` | 👤 | — | `{ "setor": "QUENTE"|null }` |
| PUT | `/eventos/{id}/setores/{tipo}` | MONITOR | `{ "tipo","geometria","descricao?" }` | SetorDTO |
| DELETE | `/eventos/{id}/setores/{tipo}` | GESTOR | — | 204 |

**SetorDTO:** `{ id, tipo, geometria:GeoJSON, descricao }`

### 6.8 Morgue (MONITOR — LGPD)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/eventos/{id}/morgue` | `{ "codigoMorgue","idTriagem?","nomeIdentificado?","documento?","idadeEstimada?","sexo?","localEncontrado":{lat,lng},"descricaoLocal?","localRemocao?","dataSincronizacao?" }` | MorgueDTO 201 |
| GET | `/eventos/{id}/morgue` | — | MorgueDTO[] |
| GET | `/eventos/{id}/morgue/{codigoMorgue}` | — | MorgueDTO |
| PATCH | `/eventos/{id}/morgue/{codigoMorgue}` | `{ "nomeIdentificado?","documento?","localRemocao?","dataRemocao?" }` | MorgueDTO |

### 6.9 Informes de campo
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos/{id}/informes` | TECNICO | **multipart**: `descricao, lat?, lng?, canalEnvio?(INTERNET\|SMS), anexo?(arquivo), dataSincronizacao?` | InformeDTO 201 |
| GET | `/eventos/{id}/informes?canal_envio=` | MONITOR | filtro opcional | InformeDTO[] |
| GET | `/eventos/{id}/informes/{informeId}` | MONITOR | — | InformeDTO |

**InformeDTO:** `{ id, eventoId, usuarioId, descricao, coordenadas, anexoUrl, canalEnvio, createdAt }`

### 6.10 Solicitações de apoio
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/eventos/{id}/apoio` | TECNICO | `{ "descricao" }` | ApoioDTO 201 |
| GET | `/eventos/{id}/apoio` | MONITOR | — | ApoioDTO[] |
| PATCH | `/eventos/{id}/apoio/{apoioId}/assumir` | GESTOR | — | ApoioDTO (EM_ATENDIMENTO) |
| PATCH | `/eventos/{id}/apoio/{apoioId}/encerrar` | GESTOR | — | ApoioDTO (ENCERRADA) |

**ApoioDTO:** `{ id, eventoId, origemId, descricao, status, responsavelId, createdAt }`

---

## 7. Alertas

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/alertas` | GESTOR | `{ "idEvento?","idTipo","mensagem","areaAlerta?":GeoJSON }` | AlertaDTO 201 |
| GET | `/alertas` | 👤 | — | AlertaDTO[] |
| GET | `/alertas/geofencing?lat=&lng=` | 👤 | — | AlertaDTO[] (alertas cuja área contém o ponto) |
| GET | `/alertas/{id}` | 👤 | — | AlertaDTO |
| DELETE | `/alertas/{id}` | GESTOR | — | 204 |

**AlertaDTO:** `{ id, idEvento, idTipo, tipoNome, mensagem, areaAlerta:GeoJSON|null, emissorId, createdAt }`

---

## 8. Pontos de Coleta (PC)

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/pontos-coleta` | COORDENADOR | `{ "pcNome","pcTipo?","coordenadas":{lat,lng},"pcDesc?","pcContato?" }` | PcDTO 201 (coordenador = usuário logado) |
| GET | `/pontos-coleta?is_active=&pc_is_verified=&pc_tipo=` | 👤 | filtros | PcDTO[] |
| GET | `/pontos-coleta/proximos?lat=&lng=&raio_metros=` | 👤 | (raio padrão 5000) | PcDTO[] (ordenado por distância) |
| GET | `/pontos-coleta/{id}` | 👤 | — | PcDTO |
| PUT | `/pontos-coleta/{id}` | COORDENADOR | `{ "pcNome?","pcDesc?","pcContato?" }` | PcDTO |
| PATCH | `/pontos-coleta/{id}/verificar` | GESTOR | — | PcDTO |
| PATCH | `/pontos-coleta/{id}/coordenador` | GESTOR | `{ "idUsuario" }` | PcDTO (define o coordenador do PC; promove o usuário a COORDENADOR se estiver abaixo desse nível — perfis superiores são preservados; 403 se o usuário estiver fora do escopo) |
| PATCH | `/pontos-coleta/{id}/desativar` | COORDENADOR | — | PcDTO |

**PcDTO:** `{ id, tenantId, coordenadorId, pcNome, pcTipo, coordenadas, pcDesc, pcContato, pcIsVerified, isActive }`

### 8.1 Vínculo PC ↔ Evento
| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| GET | `/pontos-coleta/{id}/eventos` | COORDENADOR | PcEventoDTO[] |
| PATCH | `/pontos-coleta/{id}/eventos/{eventoId}/aceitar` | COORDENADOR | PcEventoDTO (libera criar demandas) |
| PATCH | `/pontos-coleta/{id}/eventos/{eventoId}/recusar` | COORDENADOR | PcEventoDTO |

**PcEventoDTO:** `{ id, pcId, eventoId, status, dataNotificacao, dataResposta }`

### 8.2 Demandas
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/pontos-coleta/{id}/demandas` | COORDENADOR | `{ "idEvento","idTipo","prioridade?","qtdSolicitada","descricao?" }` | DemandaDTO 201. **Pré-condição:** vínculo PC↔evento ACEITO, senão 409 |
| GET | `/pontos-coleta/{id}/demandas?is_active=&prioridade=&id_evento=` | 👤 | filtros | DemandaDTO[] |
| PUT | `/pontos-coleta/{id}/demandas/{demandaId}` | COORDENADOR | `{ "prioridade?","qtdSolicitada?","descricao?" }` | DemandaDTO |
| PATCH | `/pontos-coleta/{id}/demandas/{demandaId}/desativar` | COORDENADOR | — | DemandaDTO |
| GET | `/eventos/{id}/mural` | 👤 | — | DemandaDTO[] (demandas não atendidas do evento, por prioridade) |

**DemandaDTO:** `{ id, pcId, eventoId, idTipo, tipoNome, prioridade, qtdSolicitada, qtdAtendida, descricao, isActive }`

### 8.3 Estoque
| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| GET | `/pontos-coleta/{id}/estoque` | 👤 | EstoqueDTO[] `{ id, idTipo, tipoNome, quantidade }` |
| PATCH | `/pontos-coleta/{id}/estoque/{tipoId}?quantidade=N` | COORDENADOR | EstoqueDTO |

### 8.4 Helpers
| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| POST | `/pontos-coleta/{id}/helpers/convidar?idUsuario=` | COORDENADOR | HelperDTO 201 |
| POST | `/pontos-coleta/{id}/helpers/solicitar` | TECNICO | HelperDTO 201 |
| GET | `/pontos-coleta/{id}/helpers?status=` | COORDENADOR | HelperDTO[] |
| PATCH | `/pontos-coleta/{id}/helpers/{helperId}/confirmar` | TECNICO | HelperDTO |
| PATCH | `/pontos-coleta/{id}/helpers/{helperId}/recusar` | TECNICO | HelperDTO |
| PATCH | `/pontos-coleta/{id}/helpers/{helperId}/encerrar` | COORDENADOR | HelperDTO |

**HelperDTO:** `{ id, usuarioId, pcId, iniciadoPor, status, isActive }`

---

## 9. Doações

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/doacoes` | DOADOR | `{ "idPc","idDemanda","idTipo","quantidade","descricao?","dataPrevista?" }` | DoacaoDTO 201 |
| GET | `/doacoes/minhas` | DOADOR | — | DoacaoDTO[] |
| PATCH | `/doacoes/{id}/cancelar` | DOADOR | — | DoacaoDTO (só PENDENTE) |
| GET | `/pontos-coleta/{id}/doacoes` | COORDENADOR | — | DoacaoDTO[] (pendentes do PC) |
| PATCH | `/doacoes/{id}/confirmar` | COORDENADOR | `{ "idUsuConfirmou?" }` | DoacaoDTO (RN18: atualiza demanda+estoque+pdr) |

**DoacaoDTO:** `{ id, usuarioId, pcId, demandaId, idTipo, quantidade, descricao, status, pdrReferencia, dataPrevista, dataConfirmacao }`

---

## 10. Abrigos

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/abrigos` | MONITOR | `{ "nome","descricao?","coordenadas":{lat,lng},"capacidadeTotal","contato?","idEvento?" }` | AbrigoDTO 201 |
| GET | `/abrigos?is_active=&id_evento=` | 👤 | filtros | AbrigoDTO[] |
| GET | `/abrigos/proximos?id_evento=&raio_metros=` | MONITOR | — | AbrigoDTO[] (com vagas, por distância) |
| GET | `/abrigos/{id}` | 👤 | — | AbrigoDTO |
| PUT | `/abrigos/{id}` | MONITOR | `{ "nome","descricao?","coordenadas","capacidadeTotal","contato?" }` | AbrigoDTO |

**AbrigoDTO:** `{ id, tenantId, eventoId, nome, descricao, coordenadas, capacidadeTotal, ocupacaoAtual, contato, isActive }`

### 10.1 Ocupantes (MONITOR)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/abrigos/{id}/ocupantes` | `{ "nome","documento?","idade?","isIdoso?","isCrianca?","isPcd?","isGestante?","necessidadeEspecialTipo?" }` | OcupanteDTO 201. Lotado → 409 (com `priority_blocked:true` se grupo vulnerável) |
| GET | `/abrigos/{id}/ocupantes?is_prioridade=` | filtro | OcupanteDTO[] |
| GET | `/abrigos/{id}/ocupantes/prioritarios` | — | OcupanteDTO[] |
| PATCH | `/abrigos/{id}/ocupantes/{ocupanteId}` | `{ "documento?","idade?","necessidadeEspecialTipo?" }` | OcupanteDTO |
| PATCH | `/abrigos/{id}/ocupantes/{ocupanteId}/saida` | — | OcupanteDTO (libera vaga) |

**OcupanteDTO:** `{ id, abrigoId, nome, documento, idade, isIdoso, isCrianca, isPcd, isGestante, isPrioridade, necessidadeEspecialTipo, dataEntrada, dataSaida }`

---

## 11. Hospitais

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/hospitais` | GESTOR | `{ "nome","cnes?","tipo","coordenadas":{lat,lng},"contato?","leitosTotal?","leitosDisponiveis?","leitosUti?","leitosUtiDisp?","aceitaCampanha?" }` | HospitalDTO 201 |
| GET | `/hospitais` | 👤 | — | HospitalDTO[] |
| GET | `/hospitais/proximos?lat=&lng=&raio_metros=` | MONITOR | — | HospitalDTO[] (leitos disponíveis > 0, por distância) |
| GET | `/hospitais/{id}` | 👤 | — | HospitalDTO |
| PUT | `/hospitais/{id}` | GESTOR | idem POST | HospitalDTO |

**HospitalDTO:** `{ id, tenantId, nome, cnes, tipo, coordenadas, contato, leitosTotal, leitosDisponiveis, leitosUti, leitosUtiDisp, aceitaCampanha, isActive }`

---

## 12. Infraestrutura Municipal (RN27)

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/infra-municipal` | GESTOR | `{ "nome","tipo","coordenadas":{lat,lng},"contato24h","capacidadeAtendimento?","responsavelNome?","responsavelContato?","descricao?" }` | InfraDTO 201 |
| GET | `/infra-municipal?tipo=` | 👤 | filtro | InfraDTO[] |
| GET | `/infra-municipal/proximos?id_evento=&raio_metros=` | MONITOR | — | InfraDTO[] |
| GET | `/infra-municipal/{id}` | 👤 | — | InfraDTO |
| PUT | `/infra-municipal/{id}` | GESTOR | idem POST | InfraDTO |

**InfraDTO:** `{ id, tenantId, nome, tipo, coordenadas, contato24h, capacidadeAtendimento, responsavelNome, responsavelContato, descricao, isActive }`

---

## 13. Recursos da Defesa Civil (GESTOR)

### 13.1 Catálogo
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/recursos` | `{ "idTipo","identificacao","descricao?","localizacao?":{lat,lng},"status?" }` | RecursoDTO 201 |
| GET | `/recursos?status=&id_tipo=` | filtros | RecursoDTO[] |
| GET | `/recursos/disponiveis?id_evento=&raio_metros=` | — | RecursoDTO[] (DISPONIVEL, por distância) |
| GET | `/recursos/{id}` | — | RecursoDTO |
| PUT | `/recursos/{id}` | idem POST | RecursoDTO |
| PATCH | `/recursos/{id}/localizacao` | `{ "lat","lng" }` | RecursoDTO |

**RecursoDTO:** `{ id, tenantId, idTipo, tipoNome, identificacao, descricao, localizacao, status }`

### 13.2 Alocação em eventos (RN15)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/eventos/{id}/recursos` | `{ "idRecurso","condutorNome","condutorContato","condutorHabilitacao?","responsavelNome?","responsavelContato?","observacao?" }` | RecursoEventoDTO 201. **RN15:** condutorNome+condutorContato obrigatórios, senão 422 |
| GET | `/eventos/{id}/recursos` | — | RecursoEventoDTO[] |
| PATCH | `/eventos/{id}/recursos/{recursoId}/liberar` | — | RecursoEventoDTO |

**RecursoEventoDTO:** `{ id, recursoId, eventoId, condutorNome, condutorContato, condutorHabilitacao, responsavelNome, dataAlocacao, dataLiberacao, observacao }`

### 13.3 Abastecimento (RN16)
| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/abastecimento` | GESTOR | `{ "nome","tipo","coordenadas":{lat,lng},"descricaoItens?","contato?" }` | AbastecimentoDTO 201 |
| GET | `/abastecimento` | GESTOR | — | AbastecimentoDTO[] |
| GET | `/abastecimento/proximos?lat=&lng=&raio_metros=&tipo=` | TECNICO | — | AbastecimentoDTO[] (5 mais próximos) |
| GET | `/abastecimento/{id}` | GESTOR | — | AbastecimentoDTO |
| PUT | `/abastecimento/{id}` | GESTOR | idem POST | AbastecimentoDTO |

**AbastecimentoDTO:** `{ id, tenantId, nome, tipo, coordenadas, descricaoItens, contato, isActive }`

---

## 14. Zonas de Risco (modelo ponto+raio + pontos de apoio)

Zona de risco = área de risco no modelo **ponto + raio** (como evento). Pode ter **muitos**
pontos de apoio; cada ponto de apoio atende **no máximo uma** zona. Zona com 0 apoios ativos =
`situacaoApoio: "SEM_APOIO"`. **Desativar** uma zona libera seus apoios (ficam livres para outra
zona próxima). Vincular exige **proximidade**: o apoio deve estar dentro do raio da zona.

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/zonas-risco` | GESTOR | `{ "nome","descricao?","tipo","coordenadas":{lat,lng},"raioMetros","nivelRisco":1-5,"fonte?","dataMapeamento?","idsPontoApoio?":[uuid] }` (aceita `geometria`:GeoJSON como alternativa a coordenadas) | ZonaRiscoDTO 201. Cada `idsPontoApoio` deve estar livre e dentro do raio (senão 422/409) |
| GET | `/zonas-risco` | 👤 | — | ZonaRiscoDTO[] |
| GET | `/zonas-risco/geofencing?lat=&lng=` | 👤 | — | ZonaRiscoDTO[] (zonas que contêm o ponto) |
| GET | `/zonas-risco/proximas?lat=&lng=&raio_metros=` | GESTOR | — | ZonaRiscoDTO[] |
| GET | `/zonas-risco/{id}` | 👤 | — | ZonaRiscoDTO |
| PUT | `/zonas-risco/{id}` | GESTOR | idem POST | ZonaRiscoDTO |
| PATCH | `/zonas-risco/{id}/desativar` | GESTOR | — | ZonaRiscoDTO (libera os apoios vinculados) |
| POST | `/zonas-risco/{id}/apoios` | GESTOR | `{ "idPontoApoio" }` | ZonaRiscoDTO. 409 se o apoio já atende zona ativa; 422 se fora do raio |
| DELETE | `/zonas-risco/{id}/apoios/{idPontoApoio}` | GESTOR | — | ZonaRiscoDTO (libera o apoio) |

**ZonaRiscoDTO:** `{ id, tenantId, nome, descricao, tipo, geometria:GeoJSON, coordenadas:{lat,lng}|null, raioMetros, nivelRisco, fonte, dataMapeamento, apoios:[{id,nome}], situacaoApoio:"SEM_APOIO"|"COM_APOIO", isActive }`

### 14.1 Pontos de Apoio (registro standalone — infraestrutura)
Local de apoio cadastrado de forma independente; atende no máximo uma zona de risco (`zonaRiscoId`).

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/pontos-apoio` | GESTOR | `{ "nome","descricao?","coordenadas":{lat,lng},"contato?","responsavel?","enderecoTxt?" }` | PontoApoioGeralDTO 201 (nasce livre) |
| GET | `/pontos-apoio?livre=` | 👤 | `livre=true` → só os sem zona | PontoApoioGeralDTO[] |
| GET | `/pontos-apoio/{id}` | 👤 | — | PontoApoioGeralDTO |
| PATCH | `/pontos-apoio/{id}/desativar` | GESTOR | — | PontoApoioGeralDTO |

**PontoApoioGeralDTO:** `{ id, tenantId, nome, descricao, coordenadas, contato, responsavel, enderecoTxt, zonaRiscoId, zonaRiscoNome, isActive }`

---

## 15. Pontos de Atenção (GESTOR) — RN20-23

| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/pontos-atencao` | `{ "nome","descricao?","enderecoTxt","isIndustrial","substanciaPerigosaTxt?","classeRiscoIndustrial?","nivelRisco?":1-5,"populacaoEstimada?" }` | PontoAtencaoDTO 201. Backend geocodifica o endereço. RN23: industrial sem substância+classe → 422. Nasce SEM_APOIO |
| GET | `/pontos-atencao?is_active=&is_industrial=&situacao_apoio=` | filtros | PontoAtencaoDTO[] |
| GET | `/pontos-atencao/proximos?lat=&lng=&raio_metros=` | — | PontoAtencaoDTO[] |
| GET | `/pontos-atencao/sem-apoio` | — | PontoAtencaoDTO[] (painel de lacunas, por risco) |
| GET | `/pontos-atencao/industriais` | — | PontoAtencaoDTO[] |
| GET | `/pontos-atencao/{id}` | — | PontoAtencaoDTO |
| PUT | `/pontos-atencao/{id}` | idem POST (re-geocodifica se endereço muda) | PontoAtencaoDTO |
| PATCH | `/pontos-atencao/{id}/desativar` | — | PontoAtencaoDTO |

**PontoAtencaoDTO:** `{ id, tenantId, nome, descricao, enderecoTxt, geometria:{lat,lng}, isIndustrial, substanciaPerigosaTxt, classeRiscoIndustrial, nivelRisco, populacaoEstimada, situacaoApoio, isActive }`

### 15.1 Apoios (RN21 — XOR)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/pontos-atencao/{id}/apoios` | `{ "idPc"|"idAbrigo"|"idPontoApoio", "observacao?" }` — **exatamente um** dos 3 ids, senão 422 | ApoioVinculoDTO 201 (1º vínculo → COM_APOIO) |
| GET | `/pontos-atencao/{id}/apoios` | — | ApoioVinculoDTO[] |
| DELETE | `/pontos-atencao/{id}/apoios/{apoioId}` | — | 204 (último removido → SEM_APOIO + alerta) |
| POST | `/pontos-atencao/{id}/apoios/especifico` | `{ "nome","descricao?","enderecoTxt?","contato?","responsavel?" }` | ApoioVinculoDTO 201 (cria ponto de apoio exclusivo) |

**ApoioVinculoDTO:** `{ id, pontoAtencaoId, idPc, idAbrigo, idPontoApoio, observacao }`

### 15.2 Desastres (RN22)
| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/pontos-atencao/{id}/desastres` | `{ "idDesastreTipo","observacao?" }` | DesastreVinculoDTO 201 |
| GET | `/pontos-atencao/{id}/desastres` | — | DesastreVinculoDTO[] |
| DELETE | `/pontos-atencao/{id}/desastres/{desastreVinculoId}` | — | 204 |

**DesastreVinculoDTO:** `{ id, pontoAtencaoId, desastreTipoId, desastreNome, observacao }`

---

## 16. Meteorologia (GESTOR)

| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/estacoes` | `{ "nome","fonte","codigoExterno?","coordenadas":{lat,lng},"tipo" }` | EstacaoDTO 201 |
| GET | `/estacoes` | — | EstacaoDTO[] |
| GET | `/estacoes/{id}` | — | EstacaoDTO |
| GET | `/estacoes/{id}/medicoes?page=0&size=50` | — | MedicaoDTO[] (paginado) |
| GET | `/estacoes/{id}/medicoes/ultima` | (MONITOR) | MedicaoDTO |

**EstacaoDTO:** `{ id, tenantId, nome, fonte, codigoExterno, coordenadas, tipo, isActive }`
**MedicaoDTO:** `{ id, estacaoId, dataMedicao, chuvaMm, nivelRioM, temperaturaC, umidadePct }`
*(Medições são inseridas por job agendado — não há POST manual.)*

---

## 17. Solicitações de Serviço do Cidadão (RN25/26)

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/solicitacoes-servico` | 👤 | **multipart**: `tipo, enderecoTxt, descricaoMotivo, fotos[] (≥2 arquivos)` | SolicitacaoServicoDTO 201. RN26: <2 fotos → 422. Backend geocodifica e gera PDF |
| GET | `/solicitacoes-servico/minhas` | 👤 | — | SolicitacaoServicoDTO[] |
| GET | `/solicitacoes-servico/{id}` | 👤 | — | SolicitacaoServicoDTO (com `pdfUrls`) |
| GET | `/solicitacoes-servico` | MONITOR | — | SolicitacaoServicoDTO[] (fila de triagem do tenant) |
| PATCH | `/solicitacoes-servico/{id}/assumir` | MONITOR | — | SolicitacaoServicoDTO (EM_ATENDIMENTO) |
| PATCH | `/solicitacoes-servico/{id}/concluir` | MONITOR | — | SolicitacaoServicoDTO (CONCLUIDA) |
| PATCH | `/solicitacoes-servico/{id}/indeferir` | MONITOR | `{ "parecer" }` | SolicitacaoServicoDTO (INDEFERIDA) |

**SolicitacaoServicoDTO:** `{ id, usuarioId, tipo, enderecoTxt, geometria:{lat,lng}, descricaoMotivo, fotosUrls:[{url,ordem}], status, observacaoDc, pdfUrls:[string], createdAt }`

---

## 18. Dashboard / KPIs (MONITOR+) — RF10

Todos retornam um objeto JSON de agregados, com escopo de tenant e excluindo simulados por padrão.

| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| GET | `/dashboard/eventos?is_simulado=false` | MONITOR | `{ "<STATUS>": n, ..., "total": n }` |
| GET | `/dashboard/incidentes?is_simulado=false` | MONITOR | `{ mortos, feridos, desabrigados, desaparecidos, start_vermelho, start_amarelo, start_verde, start_preto }` |
| GET | `/dashboard/doacoes` | GESTOR | `{ "<tipoDemanda>": quantidadeConfirmada, ... }` |
| GET | `/dashboard/tecnicos` | GESTOR | `{ "tecnicos_disponiveis": n }` |
| GET | `/dashboard/abrigos` | MONITOR | `{ "abrigos": n, "ocupacao_total": n, "capacidade_total": n }` |
| GET | `/dashboard/pcs` | MONITOR | `{ "pcs_ativos": n, "demandas_pendentes": n }` |
| GET | `/dashboard/pontos-atencao` | GESTOR | `{ "SEM_APOIO": n, "COM_APOIO": n }` |
| GET | `/dashboard/zonas-risco` | MONITOR | `{ "SEM_APOIO": n, "COM_APOIO": n }` (zonas ativas; SEM_APOIO = 0 apoios ativos) |

---

## 19. Notificações (👤)

| Método | Caminho | Resposta |
|--------|---------|----------|
| GET | `/notificacoes` | NotificacaoDTO[] (não lidas primeiro) |
| PATCH | `/notificacoes/{id}/ler` | NotificacaoDTO |
| PATCH | `/notificacoes/ler-todas` | `{ "atualizadas": n }` |
| GET | `/notificacoes/nao-lidas/count` | `{ "count": n }` |

**NotificacaoDTO:** `{ id, titulo, mensagem, tipo, idRef, lida, createdAt }`
*(Criadas automaticamente pelo backend via RabbitMQ em eventos de domínio — aprovação de evento, doação confirmada, ponto de atenção sem apoio, etc.)*

---

## 20. Sincronização Offline (👤) — RNF05

| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| GET | `/sync/pendentes` | — | `{ "checkins":[ids], "informes":[ids], "triagens":[ids], "morgue":[ids], "intencoes":[ids] }` (registros do usuário com data_sincronizacao nula) |
| POST | `/sync/batch` | `{ "checkins":[ids], "informes":[ids], "triagens":[ids], "morgue":[ids], "intencoes":[ids] }` | `{ "sincronizados": n, "data_sincronizacao": "ISO" }` |

---

## 21. Lookup / Referência

Para popular selects no frontend.

| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| GET | `/lookup/desastre-tipos` | 👤 | `[{ id, cobradeCod, nome, descricao }]` |
| GET | `/lookup/demanda-tipos` | 👤 | `[{ id, nome, descricao }]` |
| GET | `/lookup/recurso-tipos` | GESTOR | `[{ id, nome, descricao }]` |
| GET | `/lookup/alerta-tipos` | GESTOR | `[{ id, nome, descricao }]` |
| GET | `/lookup/roles` | ADMIN | `[{ id, nome, descricao, nivelMin }]` |

---

## 22. Fluxos típicos (ordem de chamadas)

**Doação completa:**
1. Coordenador: `POST /pontos-coleta` → cria PC.
2. Gestor: `POST /eventos` + `PATCH /eventos/{id}/aprovar` → backend cria vínculo PC↔evento NOTIFICADO e notifica o coordenador.
3. Coordenador: `GET /pontos-coleta/{id}/eventos` → vê NOTIFICADO → `PATCH .../aceitar`.
4. Coordenador: `POST /pontos-coleta/{id}/demandas`.
5. Doador: `GET /eventos/{id}/mural` ou `GET /pontos-coleta/proximos` → `POST /doacoes`.
6. Coordenador: `GET /pontos-coleta/{id}/doacoes` → `PATCH /doacoes/{id}/confirmar` (atualiza estoque/demanda).

**Resposta em campo:** criar evento → aprovar → técnico `POST /eventos/{id}/checkin` → `POST .../triagem` (reavaliações com mesmo `codigoCampo`) → monitor acompanha `GET .../incidentes/atual` e dashboard.

**Cidadão:** `POST /usuarios/cadastro/simples` → `POST /solicitacoes-servico` (com 2+ fotos) → acompanha em `GET /solicitacoes-servico/minhas`.

---

## 23. Observações para o frontend

- **Geocoding**: em Ponto de Atenção e Solicitação de Serviço, envie só `enderecoTxt` — o backend preenche a geometria.
- **Uploads** (técnico, informes, solicitações) são `multipart/form-data`; os demais são JSON.
- **Notificações em tempo real**: hoje persistidas no banco (busque via polling `/notificacoes/nao-lidas/count`). WebSocket/push não está exposto.
- **Integrações externas** (geocoding, storage de arquivos, PDF, SMS, dados meteorológicos) estão em modo *stub* no backend: URLs retornadas são fictícias (`s3://iara-dev/...`) e o geocoding gera coordenadas aproximadas. O contrato da API não muda quando os provedores reais forem ligados.
- **Datas** em ISO-8601 (`2026-05-22T00:00:00Z`).
