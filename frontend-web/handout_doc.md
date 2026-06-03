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
| GET | `/usuarios/em-risco` | GESTOR | — | UsuariosEmRiscoDTO |
| GET | `/usuarios/{id}` | GESTOR | — | UsuarioDTO |
| GET | `/usuarios?role=&status=&especialidade=` | GESTOR | filtros opcionais (role, status, especialidade=uuid) | UsuarioDTO[] |
| POST | `/usuarios` | GESTOR | `{ "nome","email","telefone?","documento","senha","tenantId","roleNome" }` | UsuarioDTO 201. Conta criada APROVADA. Sem escalonamento: perfil ≤ perfil do criador (só ADMIN cria ADMIN); tenant deve estar no escopo do criador (senão 403) |
| PATCH | `/usuarios/{id}/role` | ADMIN | `{ "roleNome" }` | UsuarioDTO (altera o perfil; alvo deve estar no escopo) |
| GET | `/usuarios/{id}/eventos-atendidos` | GESTOR | — | AtendimentoDTO[] `{ eventoId, eventoTitulo, severidade, checkins, triagens, primeiroCheckin, ultimoCheckout }` (eventos onde o usuário fez check-in ou triagem) |
| PATCH | `/usuarios/{id}/aprovar` | GESTOR | — | UsuarioDTO |
| PATCH | `/usuarios/{id}/rejeitar` | GESTOR | `{ "motivo" }` | UsuarioDTO |
| PATCH | `/usuarios/{id}/bloquear` | ADMIN | — | UsuarioDTO |

**UsuarioDTO:** `{ id, nome, email, telefone, documento, role, tenantId, especId, cadastroSts, estaDisponivel, fotoUrl, docComprovacaoNumero, docComprovacaoUrl, createdAt }`

**UsuariosEmRiscoDTO:** `{ totalUsuariosEmRisco, zonas:[ZonaComUsuariosDTO], eventos:[EventoComUsuariosDTO] }`
**ZonaComUsuariosDTO:** `{ zonaId, zonaNome, zonaTipo, nivelRisco, totalUsuarios, geometria:GeoJSON|null, usuarios:[UsuarioLocalizacaoDTO] }`
**EventoComUsuariosDTO:** `{ eventoId, eventoTitulo, severidade, status, raioMetros, coordenadas:{lat,lng}, totalUsuarios, usuarios:[UsuarioLocalizacaoDTO] }`
**UsuarioLocalizacaoDTO:** `{ id, nome, role, telefone, localizacao:{lat,lng} }` — somente exposto para usuários dentro de área de risco ativa (LGPD Art. 7 VII — interesses vitais)

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

## 7. Alertas (Fase 1)

Sistema de alertas operacional para a Defesa Civil. Cada categoria tem endpoint dedicado, com regras próprias de targeting (geofencing), cooldown e severidade. Toda criação enfileira fan-out assíncrono via RabbitMQ (`iara.alerts` + DLQ `iara.alerts.dlq`); destinatários individuais são persistidos em `iara_alerta_destinatario` com rastreamento de entrega/ack.

### 7.1 Enums

- **AlertaSeveridade:** `INFO | WARNING | DANGER | CRITICAL | EMERGENCY | SOLICITATION | OPERATIONAL` (define cor, ícone, cooldown, prioridade de entrega)
- **AlertaStatus:** `ACTIVE | EXPIRED | RESOLVED | CANCELLED | SUPERSEDED`
- **AlertaCategoria:** `DANGER_ZONE | EVENT_ZONE | TENANT_BROADCAST | TECHNICAL_REQUEST | SUPPORT_POINTS | COLLECTION_POINTS | MONITORS | PERSONALIZED | ESCALATION`
- **DeliveryStatus:** `SENT | DELIVERED | VISUALIZED | ACKNOWLEDGED | RESPONDED | FAILED`
- **AckResponse:** `ACCEPT | REFUSE | UNAVAILABLE`
- **GeofenceMode (Fase 1):** `INSIDE | NEAR | HOME` (`WORK`, `PASSED_THROUGH`, `FREQUENT` adiados para Fase 2)

### 7.2 Cooldown (Redis)

Janela por severidade — bloqueia (HTTP 409) repetições próximas com a mesma "dedup key" (combinação de zona/evento/tenant/severidade/role).

| Severidade | Cooldown |
|------------|----------|
| INFO | 10 min |
| WARNING, SOLICITATION, OPERATIONAL | 5 min |
| DANGER | 2 min |
| CRITICAL, EMERGENCY | 30 s |

### 7.3 Endpoints de criação (GESTOR) — todas retornam AlertaDTO 201

| Método | Caminho | Body |
|--------|---------|------|
| POST | `/alertas/danger-zone` | CreateDangerZoneAlertRequest |
| POST | `/alertas/event-zone` | CreateEventZoneAlertRequest |
| POST | `/alertas/tenant-broadcast` | CreateTenantBroadcastRequest |
| POST | `/alertas/technical-request` | CreateTechnicalRequestAlertRequest |
| POST | `/alertas/support-points` | CreateSupportPointsAlertRequest |
| POST | `/alertas/collection-points` | CreateCollectionPointsAlertRequest |
| POST | `/alertas/monitors` | CreateMonitorsAlertRequest |
| POST | `/alertas/personalized` | CreatePersonalizedAlertRequest |
| POST | `/alertas/escalonar` | EscalateAlertRequest |

**Escalonamento:** `tenantAlvo` DEVE ser **ancestral** do tenant do solicitante (validado via `TenantScope.isAncestor`). Severidade limitada a `DANGER`, `CRITICAL`, `EMERGENCY`. Motivo obrigatório com mínimo 20 caracteres. Cria registro permanente em `iara_alerta_escalation_log` (LGPD). Alvos: todos os GESTORes do tenant ancestral.

### 7.4 Endpoints de consulta e gestão

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| GET | `/alertas?status=&severidade=&categoria=&id_evento=&id_zona_risco=` | 👤 | filtros opcionais | AlertaDTO[] |
| GET | `/alertas/geofencing?lat=&lng=` | 👤 | — | AlertaDTO[] (apenas ACTIVE cuja `areaAlerta` contém o ponto) |
| GET | `/alertas/dashboard` | MONITOR | — | AlertaDashboardDTO |
| GET | `/alertas/{id}` | 👤 | — | AlertaDTO (com `ackSummary` agregado) |
| GET | `/alertas/{id}/destinatarios?status=` | GESTOR | filtro opcional por DeliveryStatus | AlertaDestinatarioDTO[] |
| PATCH | `/alertas/{id}/resolver` | GESTOR | — | AlertaDTO (status → RESOLVED) |
| PATCH | `/alertas/{id}/cancelar` | GESTOR | — | AlertaDTO (status → CANCELLED) |
| PATCH | `/alertas/{id}/ack` | 👤 (destinatário) | `{ "acao": "ACKNOWLEDGE" \| "ACCEPT" \| "REFUSE" \| "UNAVAILABLE" }` | AlertaDestinatarioDTO |
| DELETE | `/alertas/{id}` | ADMIN | — | 204 (hard delete; cascata em destinatários e log de escalonamento) |

### 7.5 Expiração automática

Job `AlertaExpirationJob` roda a cada 1 min: alertas ACTIVE com `dataExpiracao < now()` OU `created_at + autoExpireMinutes < now()` ficam `EXPIRED`.

### 7.6 Resolução automática

Quando um Evento muda para `ENCERRADO` ou `CANCELADO`, o listener `AlertaResolveOnEventoCloseListener` (Spring `@EventListener`) marca todos os alertas ACTIVE com `id_evento = <esse evento>` como `RESOLVED`.

### 7.7 DTOs

**AlertaDTO**
```
{
  id, tenantId, emissorId, idEvento, idZonaRisco, idTipo, tipoNome,
  titulo, mensagem,
  severidade: AlertaSeveridade, status: AlertaStatus, categoria: AlertaCategoria,
  targetRole, coordenadas:{lat,lng}|null, raioMetros, areaAlerta:GeoJSON|null,
  geofenceModes:[GeofenceMode],
  dataExpiracao, autoExpireMinutes, dataResolvido, resolvedoPor,
  requerAck, ackMinimo,
  isEscalation, escalationMotivo, escalationFromTenant,
  totalDestinatarios, ackSummary:AckSummaryDTO|null, createdAt
}
```

**AckSummaryDTO** — contagens por status: `{ sent, delivered, visualized, acknowledged, accepted, refused, unavailable, failed }`

**AlertaDestinatarioDTO**
```
{
  id, alertaId, usuarioId, usuarioNome, usuarioRole,
  deliveryStatus: DeliveryStatus, response: AckResponse|null,
  sentAt, deliveredAt, visualizedAt, acknowledgedAt, respondedAt, failureReason
}
```

**AlertaDashboardDTO**
```
{
  ativos, criticosAtivos, acksPendentes, resolvidosHoje,
  porSeveridade: { <severidade>: n },
  porCategoria: { <categoria>: n }
}
```

### 7.8 Requests

```jsonc
// CreateDangerZoneAlertRequest
{
  "idZonaRisco": "uuid|null",          // ou null + todasZonas=true
  "todasZonas": false,
  "severidade": "DANGER",
  "titulo": "...", "mensagem": "...",  // opcionais — usa defaults da categoria
  "geofenceModes": ["INSIDE","NEAR","HOME"],
  "raioMetros": 5000,                  // opcional, sobrescreve raio da zona
  "dataExpiracao": "ISO|null",
  "autoExpireMinutes": 60,
  "requerAck": false
}

// CreateEventZoneAlertRequest — mesma estrutura, idEvento + todosEventos
// CreateTenantBroadcastRequest
{
  "idTenantAlvo": "uuid",              // deve estar no escopo do criador
  "targetRole": "TECNICO|null",        // null = todos os usuários do tenant
  "severidade": "INFO", "titulo": "...", "mensagem": "...",
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60
}

// CreateTechnicalRequestAlertRequest
{
  "idEvento": "uuid",                  // obrigatório
  "especialidadeId": "uuid|null",
  "raioMetros": 10000,                 // opcional, sobrescreve raio do evento
  "tenantWide": false,                 // true → todos os técnicos do tenant
  "titulo": "...", "mensagem": "...",
  "ackMinimo": 5,                      // meta de aceites; barra de progresso na UI
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60
}

// CreateSupportPointsAlertRequest
{
  "idZonaRisco": "uuid",
  "escopoTipo": "ZONA|RAIO|TENANT",
  "raioMetros": 5000,                  // só se escopoTipo=RAIO
  "severidade": "WARNING", "titulo": "...", "mensagem": "...",
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60
}

// CreateCollectionPointsAlertRequest
{
  "idEvento": "uuid",
  "escopoTipo": "EVENTO|RAIO|TENANT",
  "raioMetros": 5000,
  "severidade": "INFO", "titulo": "...", "mensagem": "...",
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60
}

// CreateMonitorsAlertRequest
{
  "idEvento": "uuid|null",
  "idZonaRisco": "uuid|null",
  "escopoTipo": "RAIO|TENANT",
  "raioMetros": 5000,
  "severidade": "OPERATIONAL", "titulo": "...", "mensagem": "...",
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60
}

// CreatePersonalizedAlertRequest
{
  "severidade": "INFO",
  "targetRole": "DOADOR|null",
  "coordenadas": {"lat": -23.5, "lng": -46.6} | null,
  "raioMetros": 5000,
  "geofenceModes": ["INSIDE","NEAR","HOME"],
  "idEvento": "uuid|null", "idZonaRisco": "uuid|null",
  "idTenantAlvo": "uuid|null",         // null = tenant do criador
  "titulo": "...", "mensagem": "...",  // ambos obrigatórios
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60,
  "requerAck": false
}

// EscalateAlertRequest
{
  "idTenantAlvo": "uuid",              // DEVE ser ancestral (senão 403)
  "severidade": "DANGER|CRITICAL|EMERGENCY",  // só estas 3 (senão 422)
  "motivo": "≥20 caracteres",          // auditado em iara_alerta_escalation_log
  "titulo": "...", "mensagem": "...",
  "idEvento": "uuid|null", "idZonaRisco": "uuid|null",
  "dataExpiracao": "ISO|null", "autoExpireMinutes": 60
}

// AckRequest (PATCH /alertas/{id}/ack pelo destinatário)
{ "acao": "ACKNOWLEDGE | ACCEPT | REFUSE | UNAVAILABLE" }
```

### 7.9 Erros típicos da Fase 1

| Código | Cenário |
|--------|---------|
| 403 | Tenant alvo fora do escopo; ou escalonamento para tenant não-ancestral |
| 422 | Geofencing modes vazio; mensagem ausente em broadcast; severidade fora de `DANGER+` em escalonamento; motivo de escalonamento <20 chars |
| 404 | Zona/Evento/Tenant referenciado não existe; usuário não é destinatário em `/visualizar` ou `/ack` |

> **Nota:** A partir do MERGE de cooldown (1F.3), criar um alerta idêntico durante a janela de cooldown NÃO retorna mais 409 — ao invés disso, retorna 201 com o alerta existente (mesmo id), `merged: true` e `mergedCount` incrementado.

---

### 7.10 Polish da Fase 1 (Finalização)

Quatro adições que completam a Fase 1, sem schema breaking changes além da migration V7 que adiciona `merged_count` à `iara_alerta`.

#### 7.10.1 VISUALIZED tracking

| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| PATCH | `/alertas/{id}/visualizar` | 👤 (destinatário) | AlertaDestinatarioDTO |

- Idempotente. Se status ∈ {SENT, DELIVERED} → vira VISUALIZED + `visualized_at = now()`. Se já está em ACK/RESPONDED, não regride. 404 se o usuário atual não é destinatário.
- Frontend dispara automaticamente ao abrir o detalhe do alerta enquanto o usuário-logado é destinatário.

#### 7.10.2 Preview de destinatários

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/alertas/preview/{categoria}` | GESTOR | Mesmo request da criação | AlertaPreviewDTO |

`{categoria}` ∈ `danger-zone | event-zone | tenant-broadcast | technical-request | support-points | collection-points | monitors | personalized | escalonar`.

**AlertaPreviewDTO**
```
{
  totalDestinatarios: int,
  porRole: { "GESTOR": 1, "DOADOR": 2, ... },
  porTenant: { "<uuid>": n },
  cooldownAtivo: bool,
  existingAlertaId: UUID | null   // alerta que seria mesclado, se cooldownAtivo
}
```

- Executa o mesmo targeting do create, mas **NÃO** persiste e **NÃO** dispara em RabbitMQ.
- Cooldown check em modo "peek" (não consome a janela).
- Frontend usa para mostrar "X usuários receberão este alerta" antes do botão "Confirmar e enviar".

#### 7.10.3 Cooldown MERGE mode

Quando um alerta idêntico cai na janela de cooldown:

- O alerta existente recebe `merged_count++` e `data_expiracao` estendido em +30 min.
- O dispatch e o targeting **não rodam novamente** — o alerta original já alcançou seu público.
- Resposta HTTP 201 (criado), com flag `merged: true` e `id` apontando para o alerta existente.

Campos novos em **AlertaDTO**:
```
{
  ...,
  mergedCount: int,    // quantas vezes este alerta absorveu duplicatas
  merged: boolean      // true se ESTA resposta foi resultado de merge
}
```

Cache de cooldown ainda usa Redis: `alert:cooldown:<categoria>:<tenantId>:<dedupKey>`. Valor agora é o `alerta_id` (não mais "1"), permitindo a busca para merge.

#### 7.10.4 Templates padrão por categoria

| Método | Caminho | Acesso | Resposta |
|--------|---------|--------|----------|
| GET | `/alertas/templates/{categoria}` | GESTOR | AlertaTemplateDTO |

`{categoria}` ∈ `DANGER_ZONE | EVENT_ZONE | TENANT_BROADCAST | TECHNICAL_REQUEST | SUPPORT_POINTS | COLLECTION_POINTS | MONITORS | PERSONALIZED | ESCALATION`.

**AlertaTemplateDTO**
```
{
  categoria: AlertaCategoria,
  titulo: "Risco em {zonaNome}",
  mensagem: "Risco identificado em {zonaNome} ({zonaTipo}, nível {nivelRisco})…",
  placeholders: ["zonaNome", "zonaTipo", "nivelRisco"]
}
```

- Placeholders são substituídos no frontend (servidor não conhece o contexto: zona, evento, tenant).
- Frontend mostra botão "Aplicar template padrão" no Step 2 do wizard.

---

### 7.11 Alertas Agendados (Fase 2A)

Gestores podem agendar alertas para disparo futuro com recorrência opcional. Um job `@Scheduled(fixedDelay = 30s)` examina `proxima_execucao` e dispara os agendamentos prontos, autenticando temporariamente como o criador.

Casos de uso: lembretes de workshop, simulados periódicos, avisos meteorológicos previstos.

#### 7.11.1 Schema

Tabela nova `iara_alerta_agendado` (V8 migration):
```
id, id_tenant, id_usu_criou, nome, categoria, payload (JSONB),
tipo_recorrencia, inicio, fim, horario, dia_semana, dia_mes, intervalo_horas,
is_ativo, ultima_execucao, proxima_execucao, total_disparos, ultimo_erro, created_at
```

#### 7.11.2 Endpoints (GESTOR)

| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| POST | `/alertas/agendamentos` | CreateAlertaAgendadoRequest | AlertaAgendadoDTO 201 |
| GET | `/alertas/agendamentos?ativo=&categoria=` | filtros opcionais | AlertaAgendadoDTO[] |
| GET | `/alertas/agendamentos/{id}` | — | AlertaAgendadoDTO |
| PUT | `/alertas/agendamentos/{id}` | CreateAlertaAgendadoRequest | AlertaAgendadoDTO (recalcula `proxima_execucao`) |
| PATCH | `/alertas/agendamentos/{id}/ativar` | — | AlertaAgendadoDTO |
| PATCH | `/alertas/agendamentos/{id}/desativar` | — | AlertaAgendadoDTO |
| DELETE | `/alertas/agendamentos/{id}` | — | 204 |

#### 7.11.3 Tipos de recorrência

```
tipoRecorrencia ∈ {ONE_TIME, HOURLY, DAILY, WEEKLY, MONTHLY}
```

| Tipo | Campos obrigatórios |
|------|---------------------|
| `ONE_TIME` | `inicio` (dispara uma vez e desativa) |
| `HOURLY` | `inicio`, `intervaloHoras` |
| `DAILY` | `inicio`, `horario` (HH:mm:ss) |
| `WEEKLY` | `inicio`, `horario`, `diaSemana` (0=domingo..6=sábado) |
| `MONTHLY` | `inicio`, `horario`, `diaMes` (1..31; clamped a `lengthOfMonth`) |

Todos aceitam `fim` opcional. Quando `fim` < `proxima_execucao`, o agendamento é desativado.

#### 7.11.4 DTOs

**AlertaAgendadoDTO**
```jsonc
{
  "id": "uuid",
  "tenantId": "uuid",
  "criadorId": "uuid",
  "nome": "Drill semanal",
  "categoria": "TENANT_BROADCAST",
  "payload": { /* request body da categoria */ },
  "tipoRecorrencia": "WEEKLY",
  "inicio": "2026-06-01T09:00:00Z",
  "fim": null,
  "horario": "09:00:00",
  "diaSemana": 1,
  "diaMes": null,
  "intervaloHoras": null,
  "isAtivo": true,
  "ultimaExecucao": "2026-06-01T09:00:00Z",
  "proximaExecucao": "2026-06-08T09:00:00Z",
  "totalDisparos": 1,
  "ultimoErro": null,
  "createdAt": "2026-05-30T..."
}
```

**CreateAlertaAgendadoRequest**
```jsonc
{
  "nome": "Drill semanal",                  // obrigatório, ≤200 chars
  "categoria": "TENANT_BROADCAST",          // uma das 8 categorias (sem ESCALATION)
  "payload": { /* mesmo body do POST /alertas/<categoria> */ },
  "tipoRecorrencia": "WEEKLY",
  "inicio": "2026-06-01T09:00:00Z",
  "fim": null,
  "horario": "09:00:00",                    // requerido para DAILY/WEEKLY/MONTHLY
  "diaSemana": 1,                            // requerido para WEEKLY (0=Sun..6=Sat)
  "diaMes": null,                            // requerido para MONTHLY (1..31)
  "intervaloHoras": null                     // requerido para HOURLY
}
```

#### 7.11.5 Execução

- O job `AlertaSchedulerJob` autentica-se como o criador (SecurityContextHolder), invoca o método correto de `AlertaService.criar*` baseado em `categoria`, recalcula a `proxima_execucao`, e incrementa `totalDisparos`.
- Em falha: persiste `ultimo_erro` (texto curto) mas mantém o agendamento ativo, avança `proxima_execucao` para evitar loop tight. ONE_TIME que falha é desativado.
- Multi-tenant: respeita escopo via `TenantScope.canSee` no service.
- O alerta criado pelo scheduler passa pelo cooldown normal — pode ser MERGED se duplicado.

---

### 7.12 Expansão Automática de Raio (Fase 2B)

Para `TECHNICAL_REQUEST` com `ackMinimo` definido, o sistema pode ampliar progressivamente o raio do alerta quando os aceites permanecem abaixo do mínimo após uma janela de tempo. Cada passo dispara apenas para os **novos** técnicos alcançados (set difference contra destinatários já cadastrados), preservando o histórico.

#### 7.12.1 Schema (V9 migration)

```sql
ALTER TABLE iara_alerta
  ADD COLUMN expansion_radii_metros   TEXT,        -- CSV: "5000,10000,20000"
  ADD COLUMN expansion_window_minutes INT,         -- minutos entre tentativas
  ADD COLUMN current_expansion_step   INT NOT NULL DEFAULT 0,
  ADD COLUMN last_expansion_at        TIMESTAMPTZ;

CREATE INDEX idx_alerta_expand
  ON iara_alerta (status, requer_ack, current_expansion_step)
  WHERE status = 'ACTIVE' AND requer_ack = true
    AND expansion_radii_metros IS NOT NULL;
```

#### 7.12.2 Campos no Request `CreateTechnicalRequestAlertRequest`

| Campo | Tipo | Obrig. | Observação |
|-------|------|--------|------------|
| `expansionRadiiMetros` | `List<Integer>` | não | Passos crescentes (ex.: `[5000,10000,20000]`). Mínimo 2 itens. |
| `expansionWindowMinutes` | `Integer` | não | Default 5 min. Tempo mínimo entre expansões. |

Validações no service:
- Só ativa se `ackMinimo > 0` E lista contém ≥ 2 passos crescentes.
- Persiste como CSV em `expansion_radii_metros` e seta `last_expansion_at = now()`.

#### 7.12.3 Job `AlertaRadiusExpansionJob`

`@Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT45S")`. Por tick:

1. `AlertaRepository.findExpansionCandidates()` — HQL: ATIVOS, com expansion configurada, `requer_ack=true`.
2. Para cada candidato (transação independente):
   - Conta `response='ACCEPT'` em `iara_alerta_destinatario`. Se `aceites >= ackMinimo` → retorna (meta atingida).
   - Janela: se `lastExpansionAt + windowMinutes > now` → retorna (aguarda).
   - Próximo passo: se `currentExpansionStep + 1 >= radii.size()` → log INFO "esgotou passos", retorna.
   - `UsuarioRepository.tecnicosNovosNoRaio(lat, lng, toRadius, null, alertaId)` (NOT EXISTS contra destinatários atuais).
   - Sem novos: avança `currentExpansionStep`, `raioMetros = toRadius`, `lastExpansionAt = now`, log INFO, sem dispatch.
   - Com novos: `AlertaDispatcher.dispatchAdditional(alerta, newIds)` — incrementa `totalDestinatarios` (não substitui), publica RabbitMQ chunk após-commit.
   - Publica `AlertaExpandedEvent(alertaId, fromRadius, toRadius, newRecipients, currentStep)`.

#### 7.12.4 DTO

`AlertaDTO` ganha:
```
expansionRadiiMetros: number[]        // [5000,10000,20000]
expansionWindowMinutes: number | null
currentExpansionStep: number          // 0 = ainda no raio inicial
lastExpansionAt: ISO-8601 | null
```

#### 7.12.5 UI

- `TechnicalRequestForm`: seção "Expansão automática de raio" com toggle, CSV de raios e janela em minutos. Validação client-side: ordem crescente + mínimo 2 raios + `ackMinimo` obrigatório quando ativo.
- `AlertaDetailPage`: card `RadiusExpansionTimeline` aparece quando `expansionRadiiMetros.length > 0`, mostra raio inicial → atual → final, passo atual e timestamp da última expansão. Auto-refresh via React Query (refetchInterval 15s).

#### 7.12.6 Observações

- Se o evento for resolvido / alerta cancelado durante expansão, o índice `idx_alerta_expand` deixa de incluí-lo (filtro `status='ACTIVE'`) — o job para de processá-lo no próximo tick.
- O job avança o passo mesmo quando não há novos técnicos, para evitar travar em raios "vazios". Eventualmente esgota e loga `esgotou passos de expansão`.
- Cada expansão é executada em **transação própria** (`TransactionTemplate.executeWithoutResult`) — falhas em um candidato não afetam os demais.

---

### 7.13 Histórico de Localização e Modos Históricos de Geofence (Fase 2C)

A Fase 2C habilita dois novos modos de geofence — `PASSED_THROUGH` (passou pela área) e `FREQUENT` (presente com frequência) — alimentados por um histórico de localização que o app móvel envia em batch. Esse recurso só deve ser ativado para emergências legítimas: **base legal LGPD Art. 7º VII (interesses vitais)**, com retenção curta (7 dias) e cleanup automático.

#### 7.13.1 Schema (V10 migration)

```sql
CREATE TABLE iara_usuario_localizacao_historico (
    id          BIGSERIAL                 PRIMARY KEY,
    id_usuario  UUID                      NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    coordenadas GEOMETRY(Point, 4326)     NOT NULL,
    captured_at TIMESTAMPTZ               NOT NULL
);
CREATE INDEX idx_loc_hist_user_time ON iara_usuario_localizacao_historico (id_usuario, captured_at DESC);
CREATE INDEX idx_loc_hist_coord     ON iara_usuario_localizacao_historico USING GIST (coordenadas);
CREATE INDEX idx_loc_hist_captured_at ON iara_usuario_localizacao_historico (captured_at);
```

#### 7.13.2 Endpoint

| Método | Caminho | Acesso | Body | Resposta |
|--------|---------|--------|------|----------|
| POST | `/usuarios/me/localizacao-historico` | qualquer auth | `{ "pontos": [{"lat","lng","capturedAt"}, … ] }` (máx. 100 pontos por requisição; `capturedAt` deve estar dentro das últimas 24h) | `{ "inseridos": <int> }` 201 |

Insert via `JdbcTemplate.batchUpdate` direto, sem JPA, para suportar volume alto (1 ponto/min/usuário). O service `LocationHistoryService` valida que nenhum ponto seja mais antigo que 24h — clients devem enviar mais cedo (a cada 1-5 min) ou ao voltar ao foreground.

#### 7.13.3 Job `LocationHistoryCleanupJob`

`@Scheduled(cron = "0 0 3 * * *")` — diariamente às 03:00. Apaga via SQL direto:
```sql
delete from iara_usuario_localizacao_historico where captured_at < now() - interval '7 days'
```
Retenção é deliberadamente curta: o suficiente para PASSED_THROUGH (até 168h = 7d) e FREQUENT 30 dias é coberto por amostragem (mesmo com cleanup, registros agregados são suficientes).

#### 7.13.4 Novos Modos de Geofence

Adicionados a `GeofenceMode`: `PASSED_THROUGH` e `FREQUENT`. Suportados em **DangerZone**, **EventZone** e **Personalized** (NÃO em TenantBroadcast).

Parâmetros nos request DTOs (todos opcionais, com defaults razoáveis):

| Campo | Default | Aplicação |
|-------|---------|-----------|
| `lastHours` | 24 | `PASSED_THROUGH` — janela de tempo a olhar no histórico |
| `frequentMinDays` | 5 | `FREQUENT` — pelo menos N dias distintos com registro na área |
| `frequentLastDays` | 30 | `FREQUENT` — dentro dos últimos N dias |

#### 7.13.5 Queries de targeting (UsuarioRepository)

```java
usuariosQuePassaramPela(lat, lng, raioMetros, lastHours, tenantIds)
// EXISTS contra iara_usuario_localizacao_historico com ST_DWithin + filtro temporal

usuariosFrequentesNo(lat, lng, raioMetros, minDays, lastDays, tenantIds)
// GROUP BY id_usuario + HAVING COUNT(DISTINCT DATE(captured_at)) >= minDays
```

Native queries usando `make_interval(hours => :h)` / `make_interval(days => :d)` para janelas dinâmicas. Filtro de tenant + `cadastro_sts='APROVADO'` sempre aplicado.

#### 7.13.6 UI

Componente compartilhado `<HistoricalGeofenceFields>` (`pages/Alertas/components/HistoricalGeofenceFields.tsx`) usado por `DangerZoneForm`, `EventZoneForm` e `PersonalizedForm`. Renderiza:
- 2 chips toggláveis (cores laranja para indicar modos "sensíveis")
- Inputs condicionais (`lastHours`, `frequentMinDays`, `frequentLastDays`) que aparecem quando o modo respectivo está ativo
- Banner LGPD persistente quando qualquer modo histórico está ativo, citando Art. 7º VII

`buildPayload()` em cada form envia os parâmetros somente quando o modo correspondente está selecionado (sai como `undefined` caso contrário).

#### 7.13.7 LGPD

- Retenção máxima: 7 dias (job de cleanup às 03:00).
- Cadastro do mobile DEVE pedir consentimento explícito antes de iniciar envio (não é parte deste handout — responsabilidade do client).
- Auditoria: cada alerta criado com modo histórico aparece normalmente em `iara_alerta`. O motivo (zona, severidade, geofence mode) está auditável via o próprio alerta + escalation log.

---

### 7.14 Alertas Automáticos — Rules Engine (Fase 2D)

A Fase 2D entrega um motor de regras code-defined que reage a eventos de domínio criando alertas sem intervenção manual. As regras são beans Spring (`@Component`); o banco apenas guarda estado de ativação por tenant + parâmetros configuráveis + auditoria de cada disparo.

#### 7.14.1 Schema (V11 + V12 migrations)

```sql
CREATE TABLE iara_alerta_automatico (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    rule_id         VARCHAR(80) NOT NULL,
    is_ativo        BOOLEAN NOT NULL DEFAULT FALSE,
    config          JSONB,
    activated_by    UUID REFERENCES iara_usuario(id),
    activated_at    TIMESTAMPTZ,
    deactivated_by  UUID REFERENCES iara_usuario(id),
    deactivated_at  TIMESTAMPTZ,
    UNIQUE (id_tenant, rule_id)
);

CREATE TABLE iara_alerta_automatico_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant   UUID NOT NULL REFERENCES iara_tenant(id),
    rule_id     VARCHAR(80) NOT NULL,
    acao        VARCHAR(20) NOT NULL CHECK (acao IN
        ('ATIVADO','DESATIVADO','CONFIG_ALTERADO','DISPAROU','ERRO')),
    id_usuario  UUID REFERENCES iara_usuario(id),
    id_alerta   UUID,                       -- sem FK por design (V12)
    payload     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

V12 dropou o FK `id_alerta -> iara_alerta` porque o log usa `REQUIRES_NEW` propagation dentro de uma transação aninhada que cria o alerta — em alguns cenários a row de alerta ainda não estava visível para a nova tx, gerando violação. Como o log é auditoria pura, prescindir do FK é seguro.

#### 7.14.2 Interface `IAlertaAutomaticoRule`

```java
public interface IAlertaAutomaticoRule {
    String id();                              // rule_id estável
    String displayName();
    String description();
    Class<?> triggerEventClass();             // Spring event class
    List<RuleParameter> parameters();         // schema para UI
    AlertaDTO apply(Object event, Map<String,Object> config, UUID tenantId);
}
```

Cada regra é um `@Component`. O `AlertaAutomaticoRegistry` (também `@Component`) coleta todas via `@PostConstruct` e indexa por `id()` e por `triggerEventClass()`.

#### 7.14.3 Listener (`AlertaAutomaticoListener`)

Tem dois `@EventListener` (não-transacional) — um por classe de evento conhecida. Ambos delegam para `dispatch(class, event, tenantId)`:

1. Busca todas as regras com `triggerEventClass == class`
2. Para cada regra, lê a ativação do tenant via `findByTenantIdAndRuleId`
3. Se ativa, chama `rule.apply(event, config, tenantId)` — o alerta criado entra na mesma tx do publisher
4. Se sucesso, chama `logService.logDisparo(...)` em `REQUIRES_NEW`
5. Se exceção, chama `logService.logErro(...)`

**Por que `@EventListener` e não `@TransactionalEventListener(AFTER_COMMIT)`?** Tentamos AFTER_COMMIT; o problema é que iniciar transações novas dentro do handler de commit completion gera commits silenciosamente falhos (rows nunca chegam ao DB apesar de o Hibernate "ver" a entidade). Síncrono na mesma tx é determinístico e tem comportamento desejável: se o publisher der rollback, o alerta automático rola back junto.

#### 7.14.4 Publishers (em EventoService)

```java
// aprovar() — após persistir e notificar
applicationEventPublisher.publishEvent(
    new EventoAprovadoEvent(e.getId(), e.getTenant().getId(), gestor.getId()));

// mudarStatus() — após cada transição
applicationEventPublisher.publishEvent(
    new EventoStatusChangedEvent(e.getId(), e.getTenant().getId(), de, req.status()));
```

#### 7.14.5 Regras entregues (5)

| Rule ID | Trigger | Ação | Parâmetros |
|---------|---------|------|------------|
| `EVENTO_APROVADO_NOTIFICAR_PROXIMOS` | `EventoAprovadoEvent` | Cria EVENT_ZONE para INSIDE+NEAR do evento | `severidade` (enum), `requerAck` (bool) |
| `EVENTO_APROVADO_CONVOCAR_TECNICOS` | `EventoAprovadoEvent` | Cria TECHNICAL_REQUEST | `tenantWide` (bool), `ackMinimo` (number) |
| `EVENTO_APROVADO_AVISAR_PCS` | `EventoAprovadoEvent` | Cria COLLECTION_POINTS | `escopoTipo` (enum RAIO\|TENANT), `severidade` (enum) |
| `EVENTO_ALERTA_CRITICO_BROADCAST` | `EventoStatusChangedEvent` | Cria TENANT_BROADCAST EMERGENCY (filtro: `statusNovo='ALERTA_CRITICO'`) | nenhum |
| `ZONA_RISCO_CRIADA_NOTIFICAR_PROXIMOS` | `ZonaRiscoCriadaEvent` | Cria DANGER_ZONE para INSIDE+NEAR (opcionalmente +HOME) da nova zona | `severidade` (enum), `incluirEnderecoResidencial` (bool) |

#### 7.14.6 Endpoints (GESTOR)

| Método | Caminho | Body | Resposta |
|--------|---------|------|----------|
| GET | `/alertas/automaticos` | — | `AlertaAutomaticoDTO[]` (uma entrada por regra registrada, com estado do tenant) |
| PATCH | `/alertas/automaticos/{ruleId}/ativar` | `Map<String,Object>?` (config inicial) | DTO atualizado |
| PATCH | `/alertas/automaticos/{ruleId}/desativar` | — | DTO atualizado |
| PUT | `/alertas/automaticos/{ruleId}/config` | `Map<String,Object>` | DTO atualizado |
| GET | `/alertas/automaticos/log?ruleId=&page=&size=` | — | `Page<AlertaAutomaticoLogDTO>` |

Regras **não podem ser deletadas** — apenas desativadas (compliance/auditoria).

#### 7.14.7 DTO

```typescript
interface AlertaAutomaticoDTO {
  ruleId, displayName, description, triggerEvent,
  parameters: { name, type, label, defaultValue, options? }[],
  ativo, config, activatedBy, activatedAt, deactivatedAt
}
interface AlertaAutomaticoLogDTO {
  id, ruleId, acao: 'ATIVADO'|'DESATIVADO'|'CONFIG_ALTERADO'|'DISPAROU'|'ERRO',
  usuarioId, alertaId, payload, createdAt
}
```

#### 7.14.8 UI

Página `/alertas/automaticos` (`AlertasAutomaticosPage`) — uma `Card` por regra com:
- Toggle Ativar/Desativar (chama mutation com `defaultConfig()` no primeiro ativar)
- Botão Configurar → modal dinâmico que renderiza inputs baseado em `parameters[].type` (`boolean` → checkbox, `number` → input numérico, `enum` → select, `string` → input texto)
- Botão Histórico → drawer lateral mostrando o log paginado com cores por ação (`DISPAROU` laranja, `ERRO` rose, `ATIVADO` verde etc.)
- Banner explicando comportamento imutável + auditoria

Sidebar ganhou item "Alertas Automáticos" no grupo Comunicação (ícone `Bot`).

#### 7.14.9 Adicionar uma nova regra

1. Criar `@Component` em `service/automatico/rules/` implementando `IAlertaAutomaticoRule`
2. `id()` retorna string única e estável (NUNCA renomear depois de em produção)
3. `triggerEventClass()` retorna a classe de evento que dispara
4. Se o evento ainda não existe: criar um record em `service/alert/` e adicionar publish no service correspondente
5. Adicionar `@EventListener` em `AlertaAutomaticoListener` se for novo tipo de evento
6. A regra aparece automaticamente no GET `/alertas/automaticos`, no log e na UI — sem mudanças adicionais

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
| PATCH | `/solicitacoes-servico/{id}/assumir` | MONITOR | `{ "observacao?" }` | SolicitacaoServicoDTO (EM_ATENDIMENTO, registra histórico) |
| PATCH | `/solicitacoes-servico/{id}/concluir` | MONITOR | `{ "observacao?" }` | SolicitacaoServicoDTO (CONCLUIDA, registra histórico) |
| PATCH | `/solicitacoes-servico/{id}/revisar` | MONITOR | `{ "observacao?" }` | SolicitacaoServicoDTO (EM_TRIAGEM, registra histórico) |
| PATCH | `/solicitacoes-servico/{id}/indeferir` | MONITOR | `{ "parecer" }` | SolicitacaoServicoDTO (INDEFERIDA) |
| PATCH | `/solicitacoes-servico/{id}/prioridade` | MONITOR | `{ "prioridade":"BAIXA\|MEDIA\|ALTA\|CRITICA" }` | SolicitacaoServicoDTO |
| GET | `/solicitacoes-servico/{id}/historico` | MONITOR | — | SolicitacaoHistoricoDTO[] `{ id, statusPara, observacao, responsavelId, createdAt }` |

**SolicitacaoServicoDTO:** `{ id, usuarioId, tenantId, tipo, enderecoTxt, geometria:{lat,lng}, descricaoMotivo, fotosUrls:[{url,ordem}], status, prioridade:"BAIXA|MEDIA|ALTA|CRITICA"|null, responsavelId, observacaoDc, pdfUrls:[string], createdAt }`

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
