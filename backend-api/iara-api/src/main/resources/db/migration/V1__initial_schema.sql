-- =============================================================================
-- IARA — Informações para Auxílio e Resposta Ágil
-- DDL completo — PostgreSQL + PostGIS — v8 (MVP)
--
-- PRINCÍPIO DE DESIGN:
--   Simplicidade durante a ocorrência, qualidade de dados no descanso.
--   Campos obrigatórios em campo = mínimo absoluto.
--   Campos de análise/planejamento = nullable, preenchidos no pós-evento.
--
-- REDUÇÕES v6 → v7 (50 → 39 tabelas):
--   Lookup tables eliminadas (valores fixos → VARCHAR + CHECK constraint):
--     iara_event_sts, iara_severidade, iara_cadastro_sts,
--     iara_pc_tipo, iara_prioridade
--   Lookup tables MANTIDAS (podem crescer dinamicamente):
--     iara_role, iara_alerta_tipo, iara_recurso_tipo,
--     iara_desastre_tipo, iara_demanda_tipo,
--     iara_espec_categoria, iara_espec
--   Funcionalidades adiadas para Fase 2 (tabela existe, tela não):
--     iara_hospital_espec  — estrutura pronta, sem tela no MVP
--     iara_local_abastecimento_item → campo texto em iara_local_abastecimento
--     iara_limiar_alerta   — alertas automáticos são Fase 2
--   Fusões:
--     iara_informe_anexo → campo anexo_url em iara_informe_campo
--
-- TABELAS MANTIDAS INTENCIONALMENTE:
--   iara_evento_avaliacao — diferencial de apresentação + análise pós-evento
--   iara_evento_upvote    — mecanismo de veracidade, diferencial do produto
--   iara_hospital_espec   — schema pronto para Fase 2 sem custo no MVP
--
-- ESTRUTURA (ordem de dependência):
--   Seção  1 — Extensões
--   Seção  2 — Multi-tenant (Federal → Estadual → Municipal)
--   Seção  3 — Lookup tables dinâmicas
--   Seção  4 — Zonas de risco pré-cadastradas
--   Seção  5 — Usuário e autenticação
--   Seção  6 — Eventos (COBRADE/FIDE/SIMULADO/START/Morgue/Setores)
--   Seção  7 — Pontos de coleta e doações
--   Seção  8 — Abrigos temporários
--   Seção  9 — Infraestrutura hospitalar
--   Seção 10 — Recursos operacionais da DC
--   Seção 11 — Monitoramento meteorológico
--   Seção 12 — Seeds
--   Seção 13 — Triggers
--   Seção 14 — Queries de referência
-- =============================================================================


-- =============================================================================
-- SEÇÃO 1: EXTENSÕES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;


-- =============================================================================
-- SEÇÃO 2: MULTI-TENANT
--
-- Hierarquia: FEDERAL > ESTADUAL > MUNICIPAL
--   Municipal → vê apenas dados do seu município
--   Estadual  → vê todos os municípios do seu estado
--   Federal   → vê tudo; emite avisos e solicita ajuda em qualquer nível
-- =============================================================================

CREATE TABLE iara_tenant (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome        VARCHAR(200) NOT NULL,
    tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('FEDERAL','ESTADUAL','MUNICIPAL')),
    uf          VARCHAR(2),     -- NULL para FEDERAL
    ibge_cod    VARCHAR(7),     -- código IBGE do município (7 dígitos); NULL para FEDERAL/ESTADUAL
    id_pai      UUID REFERENCES iara_tenant(id) ON DELETE RESTRICT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tenant_uf   CHECK (tipo = 'FEDERAL' OR uf IS NOT NULL),
    CONSTRAINT chk_tenant_ibge CHECK (tipo != 'MUNICIPAL' OR ibge_cod IS NOT NULL),
    CONSTRAINT chk_tenant_pai  CHECK (tipo = 'FEDERAL' OR id_pai IS NOT NULL)
);
COMMENT ON TABLE  iara_tenant          IS 'SEDEC/MIDR (federal), CEPDEC (estadual), COMPDEC (municipal).';
COMMENT ON COLUMN iara_tenant.id_pai   IS 'MUNICIPAL → ESTADUAL → FEDERAL (NULL).';
COMMENT ON COLUMN iara_tenant.ibge_cod IS 'Código IBGE 7 dígitos — integração com COBRADE e S2ID.';

CREATE INDEX idx_tenant_tipo ON iara_tenant (tipo);
CREATE INDEX idx_tenant_uf   ON iara_tenant (uf);
CREATE INDEX idx_tenant_pai  ON iara_tenant (id_pai);


-- =============================================================================
-- SEÇÃO 3: LOOKUP TABLES DINÂMICAS
-- Apenas tabelas cujos valores podem crescer em produção.
-- Valores fixos foram migrados para VARCHAR + CHECK nas tabelas que os usam.
-- =============================================================================

-- Perfis de acesso (1:1 com usuário)
-- Mantido como tabela: novo perfil (ex: OBSERVADOR_ONU) pode surgir sem alterar schema
CREATE TABLE iara_role (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_nome   VARCHAR(50)  NOT NULL UNIQUE,
    role_desc   VARCHAR(255),
    nivel_min   VARCHAR(20)  NOT NULL DEFAULT 'MUNICIPAL'
                    CHECK (nivel_min IN ('MUNICIPAL','ESTADUAL','FEDERAL')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN iara_role.role_nome IS 'DOADOR, TECNICO, COORDENADOR, MONITOR, GESTOR, ADMIN';

-- Tipos de desastre com código COBRADE
-- Mantido: tem campo estruturado cobrade_cod e pode receber novos tipos
CREATE TABLE iara_desastre_tipo (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cobrade_cod     VARCHAR(13) UNIQUE,
    desastre_nome   VARCHAR(100) NOT NULL UNIQUE,
    desastre_desc   VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN iara_desastre_tipo.cobrade_cod IS 'Ex: 1.1.1.1.0 = Enxurrada. Obrigatório para FIDE/S2ID.';

-- Tipos de demanda nos pontos de coleta
-- Mantido: DC pode criar novos tipos de demanda em campo
CREATE TABLE iara_demanda_tipo (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    d_nome      VARCHAR(100) NOT NULL UNIQUE,
    d_desc      VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tipos de recurso operacional DC
-- Mantido: DC pode cadastrar novos tipos de equipamento
CREATE TABLE iara_recurso_tipo (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_nome   VARCHAR(100) NOT NULL UNIQUE,
    tipo_desc   VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Tipos de alerta emitidos pelo gestor
-- Mantido: DC federal pode criar novos tipos de alerta (ex: TSUNAMI, NUCLEAR)
CREATE TABLE iara_alerta_tipo (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_nome   VARCHAR(50)  NOT NULL UNIQUE,
    tipo_desc   VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
COMMENT ON COLUMN iara_alerta_tipo.tipo_nome IS 'AREA_RISCO, EVACUACAO, RECURSO_CRITICO, METEOROLOGICO, GERAL';

-- Categorias de especialidade técnica (ex: Saúde, Mobilidade, Assistência Social)
-- Mantido: DC pode criar novas categorias
CREATE TABLE iara_espec_categoria (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cat_nome    VARCHAR(100) NOT NULL UNIQUE,
    cat_desc    VARCHAR(255),
    id_tenant   UUID REFERENCES iara_tenant(id) ON DELETE SET NULL,
    -- NULL = padrão global do sistema; preenchido = criada por DC específica
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subcategorias de especialidade (ex: Médico, Enfermeiro dentro de Saúde)
-- Mantido: DC pode criar novas subcategorias customizadas
CREATE TABLE iara_espec (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_categoria UUID NOT NULL REFERENCES iara_espec_categoria(id) ON DELETE RESTRICT,
    espec_nome   VARCHAR(100) NOT NULL,
    espec_desc   VARCHAR(255),
    id_tenant    UUID REFERENCES iara_tenant(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_espec_nome_categoria UNIQUE (id_categoria, espec_nome)
);
COMMENT ON COLUMN iara_espec.id_tenant IS 'NULL = padrão global. DC cria subcategorias customizadas com id_tenant preenchido.';


-- =============================================================================
-- SEÇÃO 4: ZONAS DE RISCO PRÉ-CADASTRADAS
-- Mapeamento permanente da DC — independente de eventos ativos.
-- Quando evento é criado nessas coordenadas, sistema sugere área de risco.
-- =============================================================================

CREATE TABLE iara_zona_risco (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    nome            VARCHAR(200) NOT NULL,
    descricao       TEXT,
    tipo            VARCHAR(20)  NOT NULL
                        CHECK (tipo IN ('ENCHENTE','DESLIZAMENTO','INCENDIO','MULTIPERIGO','OUTRO')),
    geometria       GEOMETRY(Geometry, 4326) NOT NULL,
    -- Geometry genérico: aceita Polygon (área) e LineString (rua/via de risco)
    nivel_risco     SMALLINT NOT NULL CHECK (nivel_risco BETWEEN 1 AND 5),
    fonte           VARCHAR(255),    -- ex: "CEMADEN 2024", "Levantamento DC Municipal"
    data_mapeamento DATE,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    id_usu_cad      UUID,            -- FK adicionada após iara_usuario
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zona_risco_geom        ON iara_zona_risco USING GIST (geometria);
CREATE INDEX idx_zona_risco_geom_active ON iara_zona_risco USING GIST (geometria) WHERE is_active = TRUE;
CREATE INDEX idx_zona_risco_tenant      ON iara_zona_risco (id_tenant);
CREATE INDEX idx_zona_risco_tipo        ON iara_zona_risco (tipo);


-- =============================================================================
-- SEÇÃO 4B: PONTOS DE ATENÇÃO MUNICIPAIS — RN20 / RN21 / RN22 / RN23
--
-- Mapeamento permanente de zonas críticas no município.
-- Diferente de iara_zona_risco (área geográfica de risco genérico),
-- o Ponto de Atenção é um local específico com endereço, tipo de risco
-- associado (multi-perigo via COBRADE) e pontos de apoio pré-identificados.
--
-- Acesso: apenas GESTOR e ADMIN do tenant MUNICIPAL podem criar/editar/desativar.
-- Geocoding: o backend converte endereco_txt → geometria via API antes do INSERT.
-- =============================================================================

CREATE TABLE iara_ponto_atencao (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant               UUID NOT NULL REFERENCES iara_tenant(id),
    -- RN20: apenas GESTOR/ADMIN municipal — validado no Spring, não no banco
    nome                    VARCHAR(200) NOT NULL,
    descricao               TEXT,
    -- Endereço digitado pelo gestor; backend faz geocoding e preenche geometria
    endereco_txt            VARCHAR(500) NOT NULL,
    geometria               GEOMETRY(Point, 4326) NOT NULL,
    -- RN23: flag industrial e dados de segurança química
    is_industrial           BOOLEAN      NOT NULL DEFAULT FALSE,
    substancia_perigosa_txt TEXT,
    -- Texto livre: ex. "Amônia anidra, H₂S, GLP" — preenchido para is_industrial = TRUE
    classe_risco_industrial VARCHAR(100),
    -- Classificação ONU/GHS: ex. "Classe 2.3 — Gás Tóxico", "Classe 3 — Líquido Inflamável"
    -- Vital para que a equipe saiba se precisará de protocolo de descontaminação (Zona Morna)
    nivel_risco             SMALLINT     NOT NULL DEFAULT 3 CHECK (nivel_risco BETWEEN 1 AND 5),
    populacao_estimada      INTEGER      CHECK (populacao_estimada >= 0),
    -- Estimativa de pessoas expostas na área — auxilia dimensionamento de recursos
    is_active               BOOLEAN      NOT NULL DEFAULT TRUE,
    -- Situação de cobertura de apoio — atualizada automaticamente pelo backend
    -- quando vínculos em iara_atencao_apoio são criados ou removidos:
    --   SEM_APOIO     → nenhum ponto de apoio vinculado (gera alerta de controle ao gestor)
    --   COM_APOIO     → pelo menos 1 ponto de apoio ativo vinculado
    situacao_apoio          VARCHAR(20)  NOT NULL DEFAULT 'SEM_APOIO'
                                CHECK (situacao_apoio IN ('SEM_APOIO','COM_APOIO')),
    id_usu_cad              UUID,        -- FK adicionada após iara_usuario
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_industrial_substancia CHECK (
        is_industrial = FALSE
        OR (substancia_perigosa_txt IS NOT NULL AND classe_risco_industrial IS NOT NULL)
    )
);

CREATE INDEX idx_pa_tenant    ON iara_ponto_atencao (id_tenant);
CREATE INDEX idx_pa_geom      ON iara_ponto_atencao USING GIST (geometria);
CREATE INDEX idx_pa_active    ON iara_ponto_atencao (is_active);
CREATE INDEX idx_pa_industr   ON iara_ponto_atencao (is_industrial) WHERE is_industrial = TRUE;
CREATE INDEX idx_pa_sem_apoio ON iara_ponto_atencao (id_tenant) WHERE situacao_apoio = 'SEM_APOIO';
-- Índice parcial: gestor consulta rapidamente todas as áreas críticas sem cobertura de apoio

COMMENT ON TABLE  iara_ponto_atencao                     IS 'RN20 — Zonas críticas municipais. Geocoding feito no backend antes do INSERT.';
COMMENT ON COLUMN iara_ponto_atencao.endereco_txt          IS 'Endereço digitado pelo gestor. Backend converte para geometria via API de geocoding.';
COMMENT ON COLUMN iara_ponto_atencao.substancia_perigosa_txt IS 'RN23 — obrigatório se is_industrial = TRUE. Informa equipe de saúde sobre risco de descontaminação.';
COMMENT ON COLUMN iara_ponto_atencao.classe_risco_industrial IS 'RN23 — Classificação ONU/GHS. Ex: Classe 2.3 (Gás Tóxico), Classe 8 (Corrosivo).';
COMMENT ON COLUMN iara_ponto_atencao.situacao_apoio          IS 'Calculado pelo backend. SEM_APOIO dispara alerta de controle interno ao gestor (RN21 — vínculo é opcional no cadastro mas monitorado).';

-- RN21: vínculo obrigatório com pelo menos 1 ponto de apoio.
-- Um ponto de apoio pode ser:
--   (a) iara_pc     — ponto de coleta já cadastrado no sistema
--   (b) iara_abrigo — abrigo já cadastrado no sistema
--   (c) iara_ponto_apoio — local específico cadastrado exclusivamente para este Ponto de Atenção
--
-- iara_ponto_apoio representa apoios que não são PCs nem abrigos genéricos:
-- ex. posto da Guarda Municipal, escola parceira, galpão de empresa local.

CREATE TABLE iara_ponto_apoio (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ponto_atencao    UUID NOT NULL REFERENCES iara_ponto_atencao(id) ON DELETE CASCADE,
    -- Vínculo direto: este ponto de apoio pertence exclusivamente a este Ponto de Atenção
    nome                VARCHAR(200) NOT NULL,
    descricao           TEXT,
    endereco_txt        VARCHAR(500),
    geometria           GEOMETRY(Point, 4326),
    contato             VARCHAR(100),
    responsavel         VARCHAR(150),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ponto_apoio_pa   ON iara_ponto_apoio (id_ponto_atencao);
CREATE INDEX idx_ponto_apoio_geom ON iara_ponto_apoio USING GIST (geometria);

COMMENT ON TABLE iara_ponto_apoio IS 'RN21 — Ponto de apoio específico de um Ponto de Atenção. Diferente de PC e abrigo: não está no sistema geral, é cadastrado exclusivamente aqui.';

-- Tabela associativa: vincula um Ponto de Atenção a qualquer tipo de ponto de apoio.
-- Vínculo é OPCIONAL no momento do cadastro (RN21 revisado):
--   - Área crítica pode ser criada sem apoio → sistema atualiza situacao_apoio = 'SEM_APOIO'
--     e dispara alerta de controle interno ao gestor
--   - Quando o primeiro vínculo é criado → backend atualiza situacao_apoio = 'COM_APOIO'
--   - Quando todos os vínculos são removidos → backend reverte para 'SEM_APOIO' + novo alerta
-- Exatamente uma das três FKs deve estar preenchida por linha (XOR de 3).
-- FKs para iara_pc e iara_abrigo adicionadas via ALTER TABLE após suas criações.
CREATE TABLE iara_atencao_apoio (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ponto_atencao    UUID NOT NULL REFERENCES iara_ponto_atencao(id) ON DELETE CASCADE,
    id_pc               UUID,   -- FK: iara_pc       — adicionada via ALTER TABLE
    id_abrigo           UUID,   -- FK: iara_abrigo   — adicionada via ALTER TABLE
    id_ponto_apoio      UUID REFERENCES iara_ponto_apoio(id) ON DELETE CASCADE,
    observacao          VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- XOR de 3: exatamente uma FK preenchida por linha
    CONSTRAINT chk_apoio_xor CHECK (
        (id_pc IS NOT NULL)::int
        + (id_abrigo IS NOT NULL)::int
        + (id_ponto_apoio IS NOT NULL)::int
        = 1
    ),
    CONSTRAINT uq_atencao_apoio_pc        UNIQUE (id_ponto_atencao, id_pc),
    CONSTRAINT uq_atencao_apoio_abrigo    UNIQUE (id_ponto_atencao, id_abrigo),
    CONSTRAINT uq_atencao_apoio_pa_apoio  UNIQUE (id_ponto_atencao, id_ponto_apoio)
);

CREATE INDEX idx_atencao_apoio_pa        ON iara_atencao_apoio (id_ponto_atencao);
CREATE INDEX idx_atencao_apoio_pc        ON iara_atencao_apoio (id_pc);
CREATE INDEX idx_atencao_apoio_abrigo    ON iara_atencao_apoio (id_abrigo);
CREATE INDEX idx_atencao_apoio_pa_apoio  ON iara_atencao_apoio (id_ponto_apoio);

COMMENT ON TABLE  iara_atencao_apoio IS 'RN21 — Vínculo opcional: área crítica pode existir sem apoio. Backend monitora situacao_apoio e dispara alerta quando SEM_APOIO.';
COMMENT ON COLUMN iara_atencao_apoio.id_pc          IS 'XOR — preencher somente uma FK por linha.';
COMMENT ON COLUMN iara_atencao_apoio.id_abrigo      IS 'XOR — preencher somente uma FK por linha.';
COMMENT ON COLUMN iara_atencao_apoio.id_ponto_apoio IS 'XOR — local específico exclusivo do Ponto de Atenção (não é PC nem abrigo genérico).';

-- RN22: multi-perigo — um Ponto de Atenção pode ter múltiplos tipos de desastre (COBRADE)
CREATE TABLE iara_atencao_desastre (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_ponto_atencao    UUID NOT NULL REFERENCES iara_ponto_atencao(id) ON DELETE CASCADE,
    id_desastre_tipo    UUID NOT NULL REFERENCES iara_desastre_tipo(id) ON DELETE CASCADE,
    observacao          VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_atencao_desastre UNIQUE (id_ponto_atencao, id_desastre_tipo)
);

CREATE INDEX idx_atencao_desastre_pa ON iara_atencao_desastre (id_ponto_atencao);
CREATE INDEX idx_atencao_desastre_tp ON iara_atencao_desastre (id_desastre_tipo);

COMMENT ON TABLE iara_atencao_desastre IS 'RN22 — Multi-perigo via COBRADE. Um Ponto de Atenção pode ter deslizamento E alagamento simultaneamente.';


-- =============================================================================
-- SEÇÃO 5: USUÁRIO E AUTENTICAÇÃO
--
-- Valores fixos migrados para VARCHAR + CHECK (sem lookup table):
--   cadastro_sts: 'PENDENTE' | 'APROVADO' | 'REJEITADO' | 'BLOQUEADO'
-- =============================================================================

CREATE TABLE iara_endereco (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cep         VARCHAR(9),
    logradouro  VARCHAR(255),
    numero      VARCHAR(10),     -- VARCHAR: pode ser "S/N", "100A"
    complemento VARCHAR(100),
    bairro      VARCHAR(100),
    cidade      VARCHAR(100),
    uf          VARCHAR(2),
    coordenadas GEOMETRY(Point, 4326),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_endereco_coords ON iara_endereco USING GIST (coordenadas);

CREATE TABLE iara_usuario (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant                   UUID NOT NULL REFERENCES iara_tenant(id),
    nome                        VARCHAR(150) NOT NULL,
    email                       VARCHAR(254) NOT NULL UNIQUE,
    telefone                    VARCHAR(20),
    documento                   VARCHAR(14)  NOT NULL UNIQUE,  -- CPF: 000.000.000-00
    foto_url                    VARCHAR(500),
    id_endereco                 UUID REFERENCES iara_endereco(id) ON DELETE SET NULL,
    localizacao                 GEOMETRY(Point, 4326),
    senha_hash                  VARCHAR(255) NOT NULL,          -- bcrypt, salt embutido
    -- Role única (1:1) — permissionamento por herança no Spring
    id_role                     UUID NOT NULL REFERENCES iara_role(id),
    -- Especialidade única (1:1) — técnico escolhe UMA subcategoria
    id_espec                    UUID REFERENCES iara_espec(id) ON DELETE SET NULL,
    -- Comprovação de especialidade (obrigatório para TECNICO)
    doc_comprovacao_numero      VARCHAR(50),   -- CRM, CREA, COREN, CNH, etc.
    doc_comprovacao_url         VARCHAR(500),  -- PDF enviado para S3/MinIO
    esta_disponivel             BOOLEAN      NOT NULL DEFAULT FALSE,
    -- cadastro_sts: PENDENTE | APROVADO | REJEITADO | BLOQUEADO
    cadastro_sts                VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE'
                                    CHECK (cadastro_sts IN ('PENDENTE','APROVADO','REJEITADO','BLOQUEADO')),
    data_aprovacao_cadastro     TIMESTAMPTZ,
    id_usu_aprovador_cadastro   UUID,          -- FK self-referencial, adicionada abaixo
    is_active                   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- RN24: para role TECNICO, especialidade e comprovação são obrigatórias
-- A constraint referencia iara_role por nome — o Spring valida a regra de negócio
-- antes do INSERT; esta constraint é a última linha de defesa no banco
ALTER TABLE iara_usuario
    ADD CONSTRAINT chk_tecnico_comprovacao CHECK (
        -- Não conseguimos referenciar iara_role.role_nome diretamente num CHECK simples,
        -- então o Spring valida isso no service antes do INSERT.
        -- Esta constraint garante consistência interna: se tem espec, tem que ter doc e vice-versa
        (id_espec IS NULL AND doc_comprovacao_numero IS NULL AND doc_comprovacao_url IS NULL)
        OR
        (id_espec IS NOT NULL AND doc_comprovacao_numero IS NOT NULL AND doc_comprovacao_url IS NOT NULL)
    );

ALTER TABLE iara_usuario
    ADD CONSTRAINT fk_usuario_aprovador
    FOREIGN KEY (id_usu_aprovador_cadastro) REFERENCES iara_usuario(id) ON DELETE SET NULL;

ALTER TABLE iara_zona_risco
    ADD CONSTRAINT fk_zona_risco_usu_cad
    FOREIGN KEY (id_usu_cad) REFERENCES iara_usuario(id) ON DELETE SET NULL;

-- FK do ponto de atenção para o usuário que cadastrou (RN20)
ALTER TABLE iara_ponto_atencao
    ADD CONSTRAINT fk_ponto_atencao_usu_cad
    FOREIGN KEY (id_usu_cad) REFERENCES iara_usuario(id) ON DELETE SET NULL;

-- Marcações LGPD — criptografar com AES-256 via @Converter JPA
COMMENT ON COLUMN iara_usuario.nome                   IS 'LGPD:SENSIVEL — AES-256.';
COMMENT ON COLUMN iara_usuario.email                  IS 'LGPD:SENSIVEL — AES-256.';
COMMENT ON COLUMN iara_usuario.telefone               IS 'LGPD:SENSIVEL — AES-256.';
COMMENT ON COLUMN iara_usuario.documento              IS 'LGPD:SENSIVEL — CPF. AES-256.';
COMMENT ON COLUMN iara_usuario.localizacao            IS 'LGPD:SENSIVEL — Cautela em exports.';
COMMENT ON COLUMN iara_usuario.doc_comprovacao_numero IS 'LGPD:SENSIVEL — Registro profissional. AES-256.';
COMMENT ON COLUMN iara_usuario.doc_comprovacao_url    IS 'LGPD:SENSIVEL — URL do PDF. Acesso restrito.';
COMMENT ON COLUMN iara_usuario.senha_hash             IS 'bcrypt — nunca armazenar senha em texto plano.';

CREATE INDEX idx_usuario_tenant       ON iara_usuario (id_tenant);
CREATE INDEX idx_usuario_email        ON iara_usuario (email);
CREATE INDEX idx_usuario_documento    ON iara_usuario (documento);
CREATE INDEX idx_usuario_role         ON iara_usuario (id_role);
CREATE INDEX idx_usuario_espec        ON iara_usuario (id_espec);
CREATE INDEX idx_usuario_localizacao  ON iara_usuario USING GIST (localizacao);
CREATE INDEX idx_usuario_disponivel   ON iara_usuario (esta_disponivel) WHERE esta_disponivel = TRUE;
CREATE INDEX idx_usuario_cadastro_sts ON iara_usuario (cadastro_sts);

-- Tokens de recuperação de senha
CREATE TABLE iara_senha_reset_token (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario  UUID         NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,   -- SHA-256 do token. Nunca armazenar bruto.
    expira_em   TIMESTAMPTZ  NOT NULL,
    usado       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reset_token_hash ON iara_senha_reset_token (token_hash) WHERE usado = FALSE;
COMMENT ON COLUMN iara_senha_reset_token.token_hash IS 'LGPD:SENSIVEL — Hash SHA-256.';

-- Blacklist de tokens JWT (logout seguro e bloqueio imediato de conta)
-- @Scheduled diário limpa registros com expira_em no passado
CREATE TABLE iara_token_blacklist (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jti         VARCHAR(255) NOT NULL UNIQUE,   -- JWT ID claim
    id_usuario  UUID         NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    expira_em   TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_token_blacklist_jti    ON iara_token_blacklist (jti);
CREATE INDEX idx_token_blacklist_expira ON iara_token_blacklist (expira_em);

-- Notificações persistidas por usuário (suporte offline — RNF05)
-- RabbitMQ entrega em tempo real; esta tabela garante recuperação ao reconectar.
-- Segmentação: TECNICO recebe EVENTO/ALERTA; DOADOR recebe PC.
CREATE TABLE iara_notificacao (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario  UUID         NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    titulo      VARCHAR(200) NOT NULL,
    mensagem    TEXT         NOT NULL,
    tipo        VARCHAR(20)  NOT NULL
                    CHECK (tipo IN ('EVENTO','DEMANDA','ALERTA','PC','METEOROLOGICO','SISTEMA')),
    id_ref      UUID,        -- ID da entidade relacionada
    lida        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_usuario      ON iara_notificacao (id_usuario, lida);
CREATE INDEX idx_notif_usuario_data ON iara_notificacao (id_usuario, created_at DESC);


-- =============================================================================
-- SEÇÃO 6: EVENTOS DE DESASTRE
--
-- Valores fixos migrados para VARCHAR + CHECK (sem lookup table):
--   status:    'SOLICITADO' | 'ATIVO' | 'ALERTA_CRITICO' | 'ENCERRADO' | 'CANCELADO'
--   severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
--   fide_status: 'NAO_INICIADO' | 'EM_PREENCHIMENTO' | 'SUBMETIDO' | 'APROVADO' | 'REJEITADO'
-- =============================================================================

CREATE TABLE iara_evento (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant           UUID NOT NULL REFERENCES iara_tenant(id),
    titulo              VARCHAR(200) NOT NULL,
    descricao           TEXT,
    id_tipo             UUID NOT NULL REFERENCES iara_desastre_tipo(id),
    -- status: valores fixos — ciclo de vida bem definido, não vai crescer
    status              VARCHAR(20)  NOT NULL DEFAULT 'SOLICITADO'
                            CHECK (status IN ('SOLICITADO','ATIVO','ALERTA_CRITICO','ENCERRADO','CANCELADO')),
    -- severidade: 4 níveis universais — não vai mudar
    severidade          VARCHAR(10)  NOT NULL
                            CHECK (severidade IN ('BAIXA','MEDIA','ALTA','CRITICA')),
    id_usu_solicitante  UUID NOT NULL REFERENCES iara_usuario(id),
    id_usu_aprovador    UUID REFERENCES iara_usuario(id),
    coordenadas         GEOMETRY(Point, 4326)   NOT NULL,
    raio_metros         INTEGER NOT NULL DEFAULT 5000 CHECK (raio_metros > 0),
    area_risco          GEOMETRY(Geometry, 4326),
    id_zona_risco_ref   UUID REFERENCES iara_zona_risco(id),
    -- is_simulado: eventos de treino excluídos de KPIs, FIDE e estatísticas reais
    is_simulado         BOOLEAN NOT NULL DEFAULT FALSE,
    -- COBRADE / FIDE — DURANTE o evento: só cobrade_cod e municipio
    -- PÓS-EVENTO: demais campos preenchidos com calma
    cobrade_cod                 VARCHAR(13),
    fide_municipio_afetado      VARCHAR(200),
    fide_decreto_municipal      VARCHAR(100),
    fide_data_decreto           DATE,
    fide_pop_afetada            INTEGER CHECK (fide_pop_afetada >= 0),
    fide_danos_materiais        TEXT,
    fide_acoes_resposta         TEXT,
    fide_recursos_solicitados   TEXT,
    -- Campos obrigatórios para validação S2ID (RN17) — nullable durante o evento
    fide_prejuizo_publico       NUMERIC(15,2),
    fide_prejuizo_privado       NUMERIC(15,2),
    fide_danos_humanos_desc     TEXT,
    fide_status                 VARCHAR(20)  NOT NULL DEFAULT 'NAO_INICIADO'
                                    CHECK (fide_status IN (
                                        'NAO_INICIADO','EM_PREENCHIMENTO',
                                        'SUBMETIDO','APROVADO','REJEITADO'
                                    )),
    -- PDR — Plano Detalhado de Resposta (RN18 — prestação de contas CGU/TCU)
    pdr_referencia  VARCHAR(100),
    pdr_url         VARCHAR(500),
    data_solicitacao    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_aprovacao      TIMESTAMPTZ,
    data_inicio         TIMESTAMPTZ,
    data_encerramento   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evento_tenant      ON iara_evento (id_tenant);
CREATE INDEX idx_evento_coords      ON iara_evento USING GIST (coordenadas);
CREATE INDEX idx_evento_area_risco  ON iara_evento USING GIST (area_risco);
CREATE INDEX idx_evento_status      ON iara_evento (status);
CREATE INDEX idx_evento_tipo        ON iara_evento (id_tipo);
CREATE INDEX idx_evento_severidade  ON iara_evento (severidade);
CREATE INDEX idx_evento_fide_status ON iara_evento (fide_status);
CREATE INDEX idx_evento_simulado    ON iara_evento (is_simulado);

COMMENT ON COLUMN iara_evento.is_simulado           IS 'TRUE = treino. Excluído de KPIs, FIDE e estatísticas reais.';
COMMENT ON COLUMN iara_evento.fide_prejuizo_publico IS 'RN17 — obrigatório para submissão S2ID. Preencher no pós-evento.';
COMMENT ON COLUMN iara_evento.pdr_referencia        IS 'RN18 — doações confirmadas referenciam o PDR para auditoria CGU/TCU.';

-- Histórico de transições de status (auditoria completa)
CREATE TABLE iara_evento_historico (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento       UUID NOT NULL REFERENCES iara_evento(id) ON DELETE CASCADE,
    status_de       VARCHAR(20),   -- nullable: criação não tem status anterior
    status_para     VARCHAR(20)  NOT NULL,
    id_usu_resp     UUID NOT NULL REFERENCES iara_usuario(id),
    observacao      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_evento_hist ON iara_evento_historico (id_evento, created_at DESC);

-- Upvotes de veracidade — diferencial do produto
CREATE TABLE iara_evento_upvote (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento   UUID NOT NULL REFERENCES iara_evento(id)   ON DELETE CASCADE,
    id_usuario  UUID NOT NULL REFERENCES iara_usuario(id)  ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_evento_upvote UNIQUE (id_evento, id_usuario)
);

-- Alertas emitidos pelo gestor (RF04 + "Emitir Alertas")
CREATE TABLE iara_alerta (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    id_evento       UUID REFERENCES iara_evento(id) ON DELETE CASCADE,
    -- nullable: alerta preventivo pode existir sem evento ativo
    id_tipo         UUID NOT NULL REFERENCES iara_alerta_tipo(id),
    id_usu_emitiu   UUID NOT NULL REFERENCES iara_usuario(id),
    mensagem        TEXT NOT NULL,
    area_alerta     GEOMETRY(Geometry, 4326),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_alerta_tenant      ON iara_alerta (id_tenant);
CREATE INDEX idx_alerta_evento      ON iara_alerta (id_evento);
CREATE INDEX idx_alerta_area        ON iara_alerta USING GIST (area_alerta);
CREATE INDEX idx_alerta_area_tenant ON iara_alerta (id_tenant) WHERE area_alerta IS NOT NULL;

-- Check-ins de técnicos em eventos
CREATE TABLE iara_checkin (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento           UUID NOT NULL REFERENCES iara_evento(id)   ON DELETE CASCADE,
    id_usuario          UUID NOT NULL REFERENCES iara_usuario(id)  ON DELETE CASCADE,
    coordenadas         GEOMETRY(Point, 4326),
    data_checkin        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_checkout       TIMESTAMPTZ,
    data_sincronizacao  TIMESTAMPTZ,    -- RNF05: NULL = criado offline
    CONSTRAINT uq_checkin_ativo UNIQUE (id_evento, id_usuario, data_checkin)
);
CREATE INDEX idx_checkin_evento   ON iara_checkin (id_evento);
CREATE INDEX idx_checkin_usuario  ON iara_checkin (id_usuario);
CREATE INDEX idx_checkin_nao_sync ON iara_checkin (id_usuario) WHERE data_sincronizacao IS NULL;

-- Números de vítimas + triagem START por evento
-- Histórico completo: cada atualização cria novo registro; o mais recente é o estado atual
CREATE TABLE iara_incidentes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento       UUID    NOT NULL REFERENCES iara_evento(id) ON DELETE CASCADE,
    mortos          INTEGER NOT NULL DEFAULT 0 CHECK (mortos >= 0),
    feridos         INTEGER NOT NULL DEFAULT 0 CHECK (feridos >= 0),
    desabrigados    INTEGER NOT NULL DEFAULT 0 CHECK (desabrigados >= 0),
    desaparecidos   INTEGER NOT NULL DEFAULT 0 CHECK (desaparecidos >= 0),
    -- Protocolo START — classificação por cores para regulação médica em massa
    start_vermelho  INTEGER NOT NULL DEFAULT 0 CHECK (start_vermelho >= 0),  -- crítico/imediato
    start_amarelo   INTEGER NOT NULL DEFAULT 0 CHECK (start_amarelo >= 0),   -- urgente/observação
    start_verde     INTEGER NOT NULL DEFAULT 0 CHECK (start_verde >= 0),     -- leve/ambulante
    start_preto     INTEGER NOT NULL DEFAULT 0 CHECK (start_preto >= 0),     -- óbito/expectante
    id_usu_cad      UUID NOT NULL REFERENCES iara_usuario(id),
    id_usu_alt      UUID REFERENCES iara_usuario(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_incidentes_evento ON iara_incidentes (id_evento, created_at DESC);

-- Informes de campo enviados por técnicos
-- Suporta envio via INTERNET e via SMS (equipes isoladas sem dados móveis)
-- Fusão: anexo_url incorporado diretamente (MVP suporta 1 anexo por informe)
CREATE TABLE iara_informe_campo (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento           UUID NOT NULL REFERENCES iara_evento(id)   ON DELETE CASCADE,
    id_usuario          UUID NOT NULL REFERENCES iara_usuario(id),
    coordenadas         GEOMETRY(Point, 4326),
    descricao           TEXT NOT NULL,
    anexo_url           VARCHAR(500),   -- URL S3/MinIO; Fase 2 normaliza para tabela própria
    canal_envio         VARCHAR(10)  NOT NULL DEFAULT 'INTERNET'
                            CHECK (canal_envio IN ('INTERNET','SMS')),
    data_sincronizacao  TIMESTAMPTZ,    -- RNF05: NULL = offline
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_informe_evento   ON iara_informe_campo (id_evento);
CREATE INDEX idx_informe_coords   ON iara_informe_campo USING GIST (coordenadas);
CREATE INDEX idx_informe_nao_sync ON iara_informe_campo (id_usuario) WHERE data_sincronizacao IS NULL;
CREATE INDEX idx_informe_sms      ON iara_informe_campo (id_evento) WHERE canal_envio = 'SMS';

-- Solicitações de apoio: técnico/coordenador → gestor
CREATE TABLE iara_solicitacao_apoio (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento       UUID NOT NULL REFERENCES iara_evento(id),
    id_usu_origem   UUID NOT NULL REFERENCES iara_usuario(id),
    id_pc           UUID,        -- FK adicionada após iara_pc
    descricao       TEXT NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ABERTA'
                        CHECK (status IN ('ABERTA','EM_ATENDIMENTO','ENCERRADA')),
    id_usu_resp     UUID REFERENCES iara_usuario(id),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_apoio_evento ON iara_solicitacao_apoio (id_evento);
CREATE INDEX idx_apoio_status ON iara_solicitacao_apoio (status);

-- Avaliação pós-evento — diferencial de apresentação e análise estratégica
CREATE TABLE iara_evento_avaliacao (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento        UUID NOT NULL REFERENCES iara_evento(id) ON DELETE CASCADE,
    id_usuario       UUID NOT NULL REFERENCES iara_usuario(id),
    nota             SMALLINT CHECK (nota BETWEEN 1 AND 5),
    pontos_positivos TEXT,
    pontos_melhoria  TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_avaliacao_evento_usuario UNIQUE (id_evento, id_usuario)
);

-- Setorização da cena — RN19
-- QUENTE: perigo total (bombeiros/resgate). MORNA: descontaminação. FRIA: PMA/voluntários.
-- Obrigatório para eventos com 20+ vítimas. Bloqueio de checkin em zona QUENTE via Spring.
CREATE TABLE iara_setor_operacao (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento   UUID NOT NULL REFERENCES iara_evento(id) ON DELETE CASCADE,
    tipo        VARCHAR(10)  NOT NULL CHECK (tipo IN ('QUENTE','MORNA','FRIA')),
    geometria   GEOMETRY(Geometry, 4326) NOT NULL,
    descricao   VARCHAR(255),
    id_usu_def  UUID NOT NULL REFERENCES iara_usuario(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_setor_evento_tipo UNIQUE (id_evento, tipo)
);
CREATE INDEX idx_setor_evento ON iara_setor_operacao (id_evento);
CREATE INDEX idx_setor_geom   ON iara_setor_operacao USING GIST (geometria);

-- Triagem START individual — RN13/RN14
-- Múltiplos registros por codigo_campo = reavaliações (RN13 — triagem não é estática)
-- RN14: respira_apos_abertura = FALSE obriga classificacao = PRETO (validado no Spring)
CREATE TABLE iara_vitima_triagem (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento             UUID NOT NULL REFERENCES iara_evento(id) ON DELETE CASCADE,
    codigo_campo          VARCHAR(20) NOT NULL,       -- ex: "VIT-0042" — gerado pelo app
    nome_provisorio       VARCHAR(150),
    idade_estimada        SMALLINT,
    classificacao         VARCHAR(10)  NOT NULL
                              CHECK (classificacao IN ('VERMELHO','AMARELO','VERDE','PRETO')),
    respira_apos_abertura BOOLEAN,
    -- NULL = não avaliado; FALSE → classificacao DEVE ser PRETO (RN14)
    local_encontrado      GEOMETRY(Point, 4326),
    id_setor              UUID REFERENCES iara_setor_operacao(id),
    id_usu_triador        UUID NOT NULL REFERENCES iara_usuario(id),
    observacoes           TEXT,
    data_sincronizacao    TIMESTAMPTZ,    -- RNF05: NULL = offline
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_triagem_evento   ON iara_vitima_triagem (id_evento);
CREATE INDEX idx_triagem_codigo   ON iara_vitima_triagem (id_evento, codigo_campo);
CREATE INDEX idx_triagem_class    ON iara_vitima_triagem (id_evento, classificacao);
CREATE INDEX idx_triagem_nao_sync ON iara_vitima_triagem (id_usu_triador) WHERE data_sincronizacao IS NULL;
CREATE INDEX idx_triagem_local    ON iara_vitima_triagem USING GIST (local_encontrado);
COMMENT ON COLUMN iara_vitima_triagem.codigo_campo          IS 'Gerado pelo app (VIT-0042). Único por evento. Rápido de anotar em urgência.';
COMMENT ON COLUMN iara_vitima_triagem.respira_apos_abertura IS 'RN14 — FALSE obriga classificacao PRETO. Validado no Spring antes do INSERT.';
COMMENT ON COLUMN iara_vitima_triagem.created_at            IS 'RN13 — múltiplos registros por codigo_campo = reavaliações. O mais recente é o estado atual.';

-- Módulo Morgue — manejo de mortos (ação obrigatória em desastres)
-- Acesso restrito: MONITOR, GESTOR, ADMIN
CREATE TABLE iara_morgue (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento           UUID NOT NULL REFERENCES iara_evento(id) ON DELETE CASCADE,
    id_triagem          UUID REFERENCES iara_vitima_triagem(id) ON DELETE SET NULL,
    codigo_morgue       VARCHAR(20) NOT NULL,    -- ex: "OBT-0001" — gerado pelo app
    nome_identificado   VARCHAR(150),
    documento           VARCHAR(14),
    idade_estimada      SMALLINT,
    sexo                VARCHAR(1) CHECK (sexo IN ('M','F','I')),
    local_encontrado    GEOMETRY(Point, 4326) NOT NULL,
    descricao_local     VARCHAR(255),
    local_remocao       VARCHAR(255),
    data_remocao        TIMESTAMPTZ,
    id_usu_registro     UUID NOT NULL REFERENCES iara_usuario(id),
    id_usu_remocao      UUID REFERENCES iara_usuario(id),
    observacoes         TEXT,
    data_sincronizacao  TIMESTAMPTZ,    -- RNF05: NULL = offline
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_morgue_codigo UNIQUE (id_evento, codigo_morgue)
);
CREATE INDEX idx_morgue_evento   ON iara_morgue (id_evento);
CREATE INDEX idx_morgue_local    ON iara_morgue USING GIST (local_encontrado);
CREATE INDEX idx_morgue_nao_sync ON iara_morgue (id_usu_registro) WHERE data_sincronizacao IS NULL;
COMMENT ON TABLE  iara_morgue               IS 'LGPD:SENSIVEL — Acesso restrito: MONITOR, GESTOR, ADMIN.';
COMMENT ON COLUMN iara_morgue.nome_identificado IS 'LGPD:SENSIVEL — AES-256.';
COMMENT ON COLUMN iara_morgue.documento         IS 'LGPD:SENSIVEL — CPF. AES-256.';

-- Especialidades necessárias por evento (base do match técnico ↔ evento)
-- Gestor declara "preciso de N profissionais da especialidade X"
-- Spring filtra: u.id_espec = id_espec + disponível + aprovado + ST_DWithin
CREATE TABLE iara_evento_espec_necessaria (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_evento       UUID NOT NULL REFERENCES iara_evento(id)  ON DELETE CASCADE,
    id_espec        UUID NOT NULL REFERENCES iara_espec(id)   ON DELETE CASCADE,
    qtd_necessaria  INTEGER NOT NULL DEFAULT 1 CHECK (qtd_necessaria > 0),
    qtd_alocada     INTEGER NOT NULL DEFAULT 0 CHECK (qtd_alocada >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_evento_espec UNIQUE (id_evento, id_espec)
);
CREATE INDEX idx_evento_espec_evento ON iara_evento_espec_necessaria (id_evento);


-- =============================================================================
-- SEÇÃO 7: PONTOS DE COLETA E DOAÇÕES
--
-- Valores fixos migrados para VARCHAR + CHECK:
--   pc_tipo: 'FIXO' | 'TEMPORARIO'
--   prioridade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'SUPRIDA'
--   helpers.status: 'PENDENTE' | 'CONFIRMADO' | 'RECUSADO'
--   pc_evento.status: 'NOTIFICADO' | 'ACEITO' | 'RECUSADO'
-- =============================================================================

CREATE TABLE iara_pc (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant           UUID NOT NULL REFERENCES iara_tenant(id),
    id_coordenador      UUID NOT NULL REFERENCES iara_usuario(id),
    id_endereco         UUID REFERENCES iara_endereco(id) ON DELETE SET NULL,
    -- pc_tipo: 2 valores exaustivos — FIXO e TEMPORARIO são universais
    pc_tipo             VARCHAR(20)  NOT NULL DEFAULT 'FIXO'
                            CHECK (pc_tipo IN ('FIXO','TEMPORARIO')),
    pc_nome             VARCHAR(200) NOT NULL,
    pc_coords           GEOMETRY(Point, 4326) NOT NULL,
    pc_desc             TEXT,
    pc_contato          VARCHAR(100),
    pc_is_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
    id_usu_verificador  UUID REFERENCES iara_usuario(id),
    data_verificacao    TIMESTAMPTZ,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pc_tenant   ON iara_pc (id_tenant);
CREATE INDEX idx_pc_coords   ON iara_pc USING GIST (pc_coords);
CREATE INDEX idx_pc_verified ON iara_pc (pc_is_verified);
CREATE INDEX idx_pc_active   ON iara_pc (is_active);

ALTER TABLE iara_solicitacao_apoio
    ADD CONSTRAINT fk_apoio_pc FOREIGN KEY (id_pc) REFERENCES iara_pc(id) ON DELETE SET NULL;

-- FK de iara_atencao_apoio para iara_pc (iara_pc existe neste ponto):
ALTER TABLE iara_atencao_apoio
    ADD CONSTRAINT fk_atencao_apoio_pc FOREIGN KEY (id_pc) REFERENCES iara_pc(id) ON DELETE CASCADE;
-- FK para iara_abrigo adicionada após criação da tabela iara_abrigo (Seção 8).

-- Vínculo PC ↔ evento com ciclo de aceitação
-- Evento aprovado → INSERT NOTIFICADO (ST_DWithin) → coordenador aceita/recusa
CREATE TABLE iara_pc_evento (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pc               UUID NOT NULL REFERENCES iara_pc(id)      ON DELETE CASCADE,
    id_evento           UUID NOT NULL REFERENCES iara_evento(id)  ON DELETE CASCADE,
    status              VARCHAR(20)  NOT NULL DEFAULT 'NOTIFICADO'
                            CHECK (status IN ('NOTIFICADO','ACEITO','RECUSADO')),
    data_notificacao    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    data_resposta       TIMESTAMPTZ,
    id_usu_resp         UUID REFERENCES iara_usuario(id),
    CONSTRAINT uq_pc_evento UNIQUE (id_pc, id_evento)
);
CREATE INDEX idx_pc_evento_status ON iara_pc_evento (status);
CREATE INDEX idx_pc_evento_evento ON iara_pc_evento (id_evento);

-- Helpers: fluxo bidirecional coordenador ↔ técnico
-- iniciado_por = COORDENADOR → técnico confirma
-- iniciado_por = VOLUNTARIO  → coordenador aprova
CREATE TABLE iara_helpers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario      UUID NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    id_pc           UUID NOT NULL REFERENCES iara_pc(id)      ON DELETE CASCADE,
    iniciado_por    VARCHAR(20)  NOT NULL DEFAULT 'COORDENADOR'
                        CHECK (iniciado_por IN ('COORDENADOR','VOLUNTARIO')),
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE'
                        CHECK (status IN ('PENDENTE','CONFIRMADO','RECUSADO')),
    data_inicio     TIMESTAMPTZ,    -- preenchida quando status = CONFIRMADO
    data_fim        TIMESTAMPTZ,
    is_active       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_helper_pc UNIQUE (id_usuario, id_pc)
);
CREATE INDEX idx_helpers_pc      ON iara_helpers (id_pc);
CREATE INDEX idx_helpers_usuario ON iara_helpers (id_usuario);
CREATE INDEX idx_helpers_status  ON iara_helpers (status) WHERE status = 'PENDENTE';

-- Demandas do PC vinculadas a um evento
-- Pré-condição: iara_pc_evento.status = 'ACEITO' para o par (id_pc, id_evento)
CREATE TABLE iara_pc_demanda (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pc           UUID NOT NULL REFERENCES iara_pc(id)           ON DELETE CASCADE,
    id_evento       UUID NOT NULL REFERENCES iara_evento(id)       ON DELETE CASCADE,
    id_tipo         UUID NOT NULL REFERENCES iara_demanda_tipo(id),
    -- prioridade: valores fixos com ordenação bem definida
    prioridade      VARCHAR(10)  NOT NULL DEFAULT 'MEDIA'
                        CHECK (prioridade IN ('CRITICA','ALTA','MEDIA','BAIXA','SUPRIDA')),
    qtd_solicitada  INTEGER NOT NULL CHECK (qtd_solicitada > 0),
    qtd_atendida    INTEGER NOT NULL DEFAULT 0 CHECK (qtd_atendida >= 0),
    descricao       TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    id_usu_cad      UUID NOT NULL REFERENCES iara_usuario(id),
    id_usu_alt      UUID REFERENCES iara_usuario(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_qtd_atendida CHECK (qtd_atendida <= qtd_solicitada)
);
CREATE INDEX idx_demanda_pc       ON iara_pc_demanda (id_pc);
CREATE INDEX idx_demanda_evento   ON iara_pc_demanda (id_evento);
CREATE INDEX idx_demanda_active   ON iara_pc_demanda (is_active);
CREATE INDEX idx_demanda_prioridade ON iara_pc_demanda (prioridade);

-- Estoque atual do PC (RF07 — o que já foi recebido, separado do que ainda falta)
CREATE TABLE iara_pc_estoque (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pc       UUID NOT NULL REFERENCES iara_pc(id)           ON DELETE CASCADE,
    id_tipo     UUID NOT NULL REFERENCES iara_demanda_tipo(id),
    quantidade  INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    id_usu_alt  UUID REFERENCES iara_usuario(id),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pc_estoque UNIQUE (id_pc, id_tipo)
);
CREATE INDEX idx_estoque_pc ON iara_pc_estoque (id_pc);

-- Intenções de doação com ciclo de confirmação (RN18)
-- PENDENTE → CONFIRMADA (PC confirma recebimento) | CANCELADA | EXPIRADA (@Scheduled)
CREATE TABLE iara_doacao_intencao (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_usuario          UUID NOT NULL REFERENCES iara_usuario(id),
    id_pc               UUID NOT NULL REFERENCES iara_pc(id),
    id_demanda          UUID NOT NULL REFERENCES iara_pc_demanda(id),
    id_tipo             UUID NOT NULL REFERENCES iara_demanda_tipo(id),
    quantidade          INTEGER     NOT NULL CHECK (quantidade > 0),
    descricao           VARCHAR(255),
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE'
                            CHECK (status IN ('PENDENTE','CONFIRMADA','CANCELADA','EXPIRADA')),
    data_prevista       TIMESTAMPTZ,
    data_confirmacao    TIMESTAMPTZ,
    id_usu_confirmou    UUID REFERENCES iara_usuario(id),
    -- RN18: copiado de iara_evento.pdr_referencia na confirmação
    pdr_referencia      VARCHAR(100),
    data_sincronizacao  TIMESTAMPTZ,    -- RNF05
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_intencao_pc      ON iara_doacao_intencao (id_pc);
CREATE INDEX idx_intencao_usuario ON iara_doacao_intencao (id_usuario);
CREATE INDEX idx_intencao_demanda ON iara_doacao_intencao (id_demanda);
CREATE INDEX idx_intencao_status  ON iara_doacao_intencao (status);
COMMENT ON COLUMN iara_doacao_intencao.id_usuario    IS 'LGPD:SENSIVEL — Cautela em relatórios públicos.';
COMMENT ON COLUMN iara_doacao_intencao.pdr_referencia IS 'RN18 — vincula doação ao PDR para auditoria CGU/TCU.';


-- =============================================================================
-- SEÇÃO 8: ABRIGOS TEMPORÁRIOS
-- =============================================================================

CREATE TABLE iara_abrigo (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant           UUID NOT NULL REFERENCES iara_tenant(id),
    id_evento           UUID REFERENCES iara_evento(id) ON DELETE SET NULL,
    nome                VARCHAR(200) NOT NULL,
    descricao           TEXT,
    coordenadas         GEOMETRY(Point, 4326) NOT NULL,
    id_endereco         UUID REFERENCES iara_endereco(id) ON DELETE SET NULL,
    capacidade_total    INTEGER NOT NULL CHECK (capacidade_total > 0),
    ocupacao_atual      INTEGER NOT NULL DEFAULT 0 CHECK (ocupacao_atual >= 0),
    id_responsavel      UUID REFERENCES iara_usuario(id),
    contato             VARCHAR(100),
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_ocupacao CHECK (ocupacao_atual <= capacidade_total)
);
CREATE INDEX idx_abrigo_tenant ON iara_abrigo (id_tenant);
CREATE INDEX idx_abrigo_coords ON iara_abrigo USING GIST (coordenadas);
CREATE INDEX idx_abrigo_evento ON iara_abrigo (id_evento);
CREATE INDEX idx_abrigo_active ON iara_abrigo (is_active);

-- FK de iara_atencao_apoio para iara_abrigo (iara_abrigo existe neste ponto):
ALTER TABLE iara_atencao_apoio
    ADD CONSTRAINT fk_atencao_apoio_abrigo FOREIGN KEY (id_abrigo) REFERENCES iara_abrigo(id) ON DELETE CASCADE;

-- Desabrigados com grupos vulneráveis — RN12
-- DURANTE a ocorrência: nome + flags de vulnerabilidade (campos rápidos)
-- PÓS-ocorrência: documento, necessidades especiais, observações
CREATE TABLE iara_abrigo_ocupante (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_abrigo       UUID NOT NULL REFERENCES iara_abrigo(id) ON DELETE CASCADE,
    nome            VARCHAR(150) NOT NULL,
    documento       VARCHAR(14),
    idade           SMALLINT CHECK (idade >= 0 AND idade <= 150),
    is_idoso        BOOLEAN NOT NULL DEFAULT FALSE,   -- 60+
    is_crianca      BOOLEAN NOT NULL DEFAULT FALSE,   -- até 12 anos
    is_pcd          BOOLEAN NOT NULL DEFAULT FALSE,   -- pessoa com deficiência
    is_gestante     BOOLEAN NOT NULL DEFAULT FALSE,
    -- RN12: calculado automaticamente — TRUE se qualquer grupo vulnerável marcado
    -- Interface sinaliza "Atenção Prioritária"; lotação garante vaga antes de adultos saudáveis
    is_prioridade   BOOLEAN GENERATED ALWAYS AS (
                        is_idoso OR is_crianca OR is_pcd OR is_gestante
                    ) STORED,
    necessidade_especial_tipo VARCHAR(255),
    -- Preenchido pós-urgência. Ex: "Insulina diária", "Cadeira de rodas", "Fralda geriátrica"
    observacoes     TEXT,
    data_entrada    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_saida      TIMESTAMPTZ,
    id_usu_cad      UUID REFERENCES iara_usuario(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_abrigo_ocup_abrigo     ON iara_abrigo_ocupante (id_abrigo);
CREATE INDEX idx_abrigo_ocup_prioridade ON iara_abrigo_ocupante (id_abrigo) WHERE is_prioridade = TRUE;
COMMENT ON COLUMN iara_abrigo_ocupante.is_prioridade              IS 'RN12 — gerado automaticamente. Garante vaga prioritária em lotação.';
COMMENT ON COLUMN iara_abrigo_ocupante.necessidade_especial_tipo  IS 'Preenchido pós-urgência. Informa coordenador sobre insumos específicos.';
COMMENT ON COLUMN iara_abrigo_ocupante.nome      IS 'LGPD:SENSIVEL — AES-256.';
COMMENT ON COLUMN iara_abrigo_ocupante.documento IS 'LGPD:SENSIVEL — AES-256.';


-- =============================================================================
-- SEÇÃO 9: INFRAESTRUTURA HOSPITALAR
-- Schema completo no MVP. Tela de especialidades implementada na Fase 2.
-- =============================================================================

CREATE TABLE iara_hospital (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant           UUID NOT NULL REFERENCES iara_tenant(id),
    nome                VARCHAR(200) NOT NULL,
    cnes                VARCHAR(7) UNIQUE,   -- Cadastro Nacional de Estabelecimentos de Saúde
    tipo                VARCHAR(20)  NOT NULL
                            CHECK (tipo IN ('PUBLICO','PRIVADO','MISTO','CAMPANHA')),
    coordenadas         GEOMETRY(Point, 4326) NOT NULL,
    id_endereco         UUID REFERENCES iara_endereco(id) ON DELETE SET NULL,
    contato             VARCHAR(100),
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    leitos_total        INTEGER CHECK (leitos_total >= 0),
    leitos_disponiveis  INTEGER CHECK (leitos_disponiveis >= 0),
    leitos_uti          INTEGER CHECK (leitos_uti >= 0),
    leitos_uti_disp     INTEGER CHECK (leitos_uti_disp >= 0),
    aceita_campanha     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leitos_disp CHECK (leitos_disponiveis IS NULL OR leitos_total IS NULL
                                      OR leitos_disponiveis <= leitos_total),
    CONSTRAINT chk_uti_disp    CHECK (leitos_uti_disp IS NULL OR leitos_uti IS NULL
                                      OR leitos_uti_disp <= leitos_uti)
);
CREATE INDEX idx_hospital_tenant ON iara_hospital (id_tenant);
CREATE INDEX idx_hospital_coords ON iara_hospital USING GIST (coordenadas);
CREATE INDEX idx_hospital_active ON iara_hospital (is_active);

-- Especialidades do corpo clínico — Fase 2 (tabela existe, tela não)
CREATE TABLE iara_hospital_espec (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_hospital     UUID NOT NULL REFERENCES iara_hospital(id) ON DELETE CASCADE,
    id_espec        UUID NOT NULL REFERENCES iara_espec(id),
    qtd_profissionais INTEGER CHECK (qtd_profissionais >= 0),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hospital_espec UNIQUE (id_hospital, id_espec)
);
COMMENT ON TABLE iara_hospital_espec IS 'Fase 2 — tabela existe no schema, tela não implementada no MVP.';

-- =============================================================================
-- RN27 — INFRAESTRUTURA MUNICIPAL PERMANENTE
-- Secretarias de Saúde, centros de triagem, postos avançados e outros locais
-- de apoio mantidos pela DC independentemente de eventos ativos.
-- Mais genérico que iara_hospital: cobre qualquer ponto de suporte institucional.
-- =============================================================================

CREATE TABLE iara_infra_municipal (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant               UUID NOT NULL REFERENCES iara_tenant(id),
    nome                    VARCHAR(200) NOT NULL,
    tipo                    VARCHAR(30)  NOT NULL
                                CHECK (tipo IN (
                                    'SECRETARIA_SAUDE',
                                    'SECRETARIA_ASSISTENCIA',
                                    'CENTRO_TRIAGEM',
                                    'POSTO_AVANCADO',
                                    'CENTRO_COMANDO',
                                    'OUTRO'
                                )),
    coordenadas             GEOMETRY(Point, 4326) NOT NULL,
    id_endereco             UUID REFERENCES iara_endereco(id) ON DELETE SET NULL,
    contato_24h             VARCHAR(100) NOT NULL,
    -- RN27: campo obrigatório para regulação médica e suporte logístico
    capacidade_atendimento  INTEGER CHECK (capacidade_atendimento >= 0),
    -- Número de pessoas que o local pode atender simultaneamente
    responsavel_nome        VARCHAR(150),
    responsavel_contato     VARCHAR(20),
    descricao               TEXT,
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_infra_tenant ON iara_infra_municipal (id_tenant);
CREATE INDEX idx_infra_coords ON iara_infra_municipal USING GIST (coordenadas);
CREATE INDEX idx_infra_tipo   ON iara_infra_municipal (tipo);
CREATE INDEX idx_infra_active ON iara_infra_municipal (is_active);

COMMENT ON TABLE  iara_infra_municipal                      IS 'RN27 — Mapa permanente de infraestrutura municipal. Independente de eventos ativos.';
COMMENT ON COLUMN iara_infra_municipal.contato_24h          IS 'RN27 — Obrigatório. Facilita regulação médica e suporte logístico em desastres com múltiplas vítimas.';
COMMENT ON COLUMN iara_infra_municipal.capacidade_atendimento IS 'RN27 — Número de pessoas atendidas simultaneamente. Base para dimensionamento de recursos.';


-- =============================================================================
-- SEÇÃO 10: RECURSOS OPERACIONAIS DA DEFESA CIVIL
-- =============================================================================

CREATE TABLE iara_recurso_dc (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    id_tipo         UUID NOT NULL REFERENCES iara_recurso_tipo(id),
    identificacao   VARCHAR(100) NOT NULL,   -- placa, nº série, nome da embarcação
    descricao       VARCHAR(255),
    localizacao     GEOMETRY(Point, 4326),
    status          VARCHAR(20)  NOT NULL DEFAULT 'DISPONIVEL'
                        CHECK (status IN ('DISPONIVEL','EM_OPERACAO','MANUTENCAO','INDISPONIVEL')),
    id_usu_resp     UUID REFERENCES iara_usuario(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_recurso_dc_tenant ON iara_recurso_dc (id_tenant);
CREATE INDEX idx_recurso_dc_loc    ON iara_recurso_dc USING GIST (localizacao);
CREATE INDEX idx_recurso_dc_status ON iara_recurso_dc (status);

-- Alocação de recursos em eventos com condutor habilitado — RN15
CREATE TABLE iara_recurso_dc_evento (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_recurso          UUID NOT NULL REFERENCES iara_recurso_dc(id)  ON DELETE CASCADE,
    id_evento           UUID NOT NULL REFERENCES iara_evento(id)      ON DELETE CASCADE,
    id_usu_alocou       UUID NOT NULL REFERENCES iara_usuario(id),
    condutor_nome       VARCHAR(150),    -- RN15: condutor habilitado
    condutor_contato    VARCHAR(20),     -- telefone 24h
    condutor_habilitacao VARCHAR(20),    -- nº CNH ou habilitação náutica
    responsavel_nome    VARCHAR(150),    -- responsável pela liberação
    responsavel_contato VARCHAR(20),
    data_alocacao       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_liberacao      TIMESTAMPTZ,
    observacao          VARCHAR(255),
    CONSTRAINT uq_recurso_evento UNIQUE (id_recurso, id_evento)
);
CREATE INDEX idx_recurso_evento_evento  ON iara_recurso_dc_evento (id_evento);
CREATE INDEX idx_recurso_evento_recurso ON iara_recurso_dc_evento (id_recurso);
COMMENT ON COLUMN iara_recurso_dc_evento.condutor_nome    IS 'RN15 — LGPD:SENSIVEL. AES-256.';
COMMENT ON COLUMN iara_recurso_dc_evento.condutor_contato IS 'RN15 — LGPD:SENSIVEL. AES-256.';

-- Locais de abastecimento de combustível e kits humanitários — RN16
-- Fusão: itens detalhados descritos em texto livre (Fase 2 normaliza)
CREATE TABLE iara_local_abastecimento (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    nome            VARCHAR(200) NOT NULL,
    tipo            VARCHAR(20)  NOT NULL
                        CHECK (tipo IN ('COMBUSTIVEL','KIT_HUMANITARIO','MISTO')),
    coordenadas     GEOMETRY(Point, 4326) NOT NULL,
    id_endereco     UUID REFERENCES iara_endereco(id) ON DELETE SET NULL,
    descricao_itens TEXT,      -- lista livre de itens disponíveis (Fase 2 normaliza)
    contato         VARCHAR(100),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_abastec_tenant ON iara_local_abastecimento (id_tenant);
CREATE INDEX idx_abastec_coords ON iara_local_abastecimento USING GIST (coordenadas);
COMMENT ON COLUMN iara_local_abastecimento.descricao_itens IS 'Fase 2: normalizar para tabela iara_local_abastecimento_item com quantidade e unidade por item.';


-- =============================================================================
-- SEÇÃO 11: MONITORAMENTO METEOROLÓGICO (CEMADEN / INMET)
-- Dados externos ingeridos via job @Scheduled.
-- Dashboard e geofencing consultam o banco local (não a API diretamente).
-- iara_limiar_alerta removida do MVP — alertas automáticos são Fase 2.
-- =============================================================================

CREATE TABLE iara_estacao_monitoramento (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    nome            VARCHAR(200) NOT NULL,
    fonte           VARCHAR(20)  NOT NULL
                        CHECK (fonte IN ('CEMADEN','INMET','DC_PROPRIA','OUTRO')),
    codigo_externo  VARCHAR(50),
    coordenadas     GEOMETRY(Point, 4326) NOT NULL,
    tipo            VARCHAR(20)  NOT NULL
                        CHECK (tipo IN ('PLUVIOMETRO','HIDROMETRO','TERMOMETRO','MULTIPLO')),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_estacao_tenant ON iara_estacao_monitoramento (id_tenant);
CREATE INDEX idx_estacao_coords ON iara_estacao_monitoramento USING GIST (coordenadas);

-- Leituras ingeridas das estações
CREATE TABLE iara_medicao (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_estacao      UUID NOT NULL REFERENCES iara_estacao_monitoramento(id) ON DELETE CASCADE,
    data_medicao    TIMESTAMPTZ  NOT NULL,
    chuva_mm        NUMERIC(7,2),
    nivel_rio_m     NUMERIC(7,2),
    temperatura_c   NUMERIC(5,2),
    umidade_pct     NUMERIC(5,2),
    dados_raw       JSONB,       -- payload original preservado para reprocessamento e auditoria
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_medicao_estacao ON iara_medicao (id_estacao, data_medicao DESC);
CREATE INDEX idx_medicao_data    ON iara_medicao (data_medicao DESC);
COMMENT ON COLUMN iara_medicao.dados_raw IS 'Payload JSON original da API CEMADEN/INMET. Preservado para auditoria e FIDE.';


-- =============================================================================
-- SEÇÃO 11B: SOLICITAÇÕES DE SERVIÇO DO CIDADÃO — RN25 / RN26
--
-- USUARIO_SIMPLES pode abrir solicitações preventivas sem precisar
-- de aprovação de cadastro técnico.
-- Exemplos: corte de árvore, vistoria de rachadura, limpeza de bueiro.
-- Mínimo 2 fotos obrigatórias (RN26) — armazenadas como array JSONB.
-- Após salvar, backend dispara geração automática do PDF de vistoria (RN26).
-- =============================================================================

CREATE TABLE iara_solicitacao_servico (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID NOT NULL REFERENCES iara_tenant(id),
    id_usuario      UUID NOT NULL REFERENCES iara_usuario(id),
    tipo            VARCHAR(30)  NOT NULL
                        CHECK (tipo IN (
                            'CORTE_ARVORE',
                            'VISTORIA_RACHADURA',
                            'LIMPEZA_BUEIRO',
                            'RISCO_DESLIZAMENTO',
                            'OUTRO'
                        )),
    -- RN26: endereço e descrição obrigatórios
    endereco_txt    VARCHAR(500) NOT NULL,
    geometria       GEOMETRY(Point, 4326),
    -- Preenchido pelo backend via geocoding após o INSERT
    descricao_motivo TEXT        NOT NULL,
    -- RN26: mínimo 2 fotos — validado no Spring antes do INSERT
    -- Array JSONB: [{"url": "s3://...", "ordem": 1}, {"url": "s3://...", "ordem": 2}]
    fotos_urls      JSONB        NOT NULL DEFAULT '[]'::jsonb,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ABERTA'
                        CHECK (status IN ('ABERTA','EM_TRIAGEM','EM_ATENDIMENTO','CONCLUIDA','INDEFERIDA')),
    id_usu_resp     UUID REFERENCES iara_usuario(id),   -- técnico/monitor da DC que assumiu
    observacao_dc   TEXT,                               -- parecer da DC após triagem
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solsrv_tenant  ON iara_solicitacao_servico (id_tenant);
CREATE INDEX idx_solsrv_usuario ON iara_solicitacao_servico (id_usuario);
CREATE INDEX idx_solsrv_status  ON iara_solicitacao_servico (status);
CREATE INDEX idx_solsrv_tipo    ON iara_solicitacao_servico (tipo);
CREATE INDEX idx_solsrv_geom    ON iara_solicitacao_servico USING GIST (geometria);

COMMENT ON TABLE  iara_solicitacao_servico           IS 'RN26 — Demanda espontânea do USUARIO_SIMPLES. Mínimo 2 fotos validado no Spring.';
COMMENT ON COLUMN iara_solicitacao_servico.fotos_urls IS 'RN26 — JSONB array. Ex: [{"url":"s3://...","ordem":1},{"url":"s3://...","ordem":2}]. Mín 2 itens.';
COMMENT ON COLUMN iara_solicitacao_servico.geometria  IS 'Preenchido pelo backend via geocoding do endereco_txt após o INSERT.';

-- Documentos oficiais gerados automaticamente (RN26)
-- Quando iara_solicitacao_servico é criada, o backend gera o PDF de vistoria
-- com dados do cidadão e fotos, envia para S3 e registra aqui.
-- Este registro entra automaticamente na fila de triagem da DC Municipal.
CREATE TABLE iara_documento_gerado (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_solicitacao  UUID NOT NULL REFERENCES iara_solicitacao_servico(id) ON DELETE CASCADE,
    tipo_doc        VARCHAR(50)  NOT NULL DEFAULT 'FORMULARIO_VISTORIA'
                        CHECK (tipo_doc IN ('FORMULARIO_VISTORIA','RELATORIO_TRIAGEM','OUTRO')),
    url_pdf_s3      VARCHAR(500) NOT NULL,
    -- URL do PDF gerado e armazenado no S3/MinIO
    gerado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    hash_sha256     VARCHAR(64),
    -- Hash do arquivo para verificação de integridade
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docger_solicitacao ON iara_documento_gerado (id_solicitacao);

COMMENT ON TABLE  iara_documento_gerado          IS 'RN26 — PDF gerado automaticamente pelo backend após criação da solicitação. Entra na fila de triagem da DC.';
COMMENT ON COLUMN iara_documento_gerado.hash_sha256 IS 'SHA-256 do PDF para auditoria e verificação de integridade do documento oficial.';


-- =============================================================================
-- SEÇÃO 12: SEEDS — DADOS INICIAIS
-- =============================================================================

INSERT INTO iara_tenant (id, nome, tipo) VALUES
    ('00000000-0000-0000-0000-000000000001',
     'SEDEC/MIDR — Secretaria Nacional de Proteção e Defesa Civil',
     'FEDERAL');

INSERT INTO iara_role (role_nome, role_desc, nivel_min) VALUES
    ('DOADOR',          'Pessoa física ou jurídica que realiza doações',                        'MUNICIPAL'),
    ('TECNICO',         'Profissional técnico com especialidade comprovada',                    'MUNICIPAL'),
    ('COORDENADOR',     'Responsável por um ponto de coleta',                                   'MUNICIPAL'),
    ('MONITOR',         'Monitora eventos e demandas em campo',                                 'MUNICIPAL'),
    ('GESTOR',          'Gestor com acesso analítico e operacional do seu nível',               'MUNICIPAL'),
    ('ADMIN',           'Administrador total do sistema no seu nível de tenant',                'MUNICIPAL'),
    -- RN25: cidadão com visão limitada — mapa de riscos, mural e solicitações preventivas
    ('USUARIO_SIMPLES', 'Cidadão com acesso ao mapa de riscos, mural público e solicitações',  'MUNICIPAL');

INSERT INTO iara_alerta_tipo (tipo_nome, tipo_desc) VALUES
    ('AREA_RISCO',      'Área com risco iminente — proibição de acesso'),
    ('EVACUACAO',       'Ordem ou recomendação de evacuação'),
    ('RECURSO_CRITICO', 'Item ou recurso humano em nível crítico de escassez'),
    ('METEOROLOGICO',   'Alerta precoce por dado meteorológico (CEMADEN/INMET)'),
    ('GERAL',           'Comunicado geral sem área específica'),
    -- Alerta de controle interno: Ponto de Atenção cadastrado sem ponto de apoio vinculado
    ('SEM_PONTO_APOIO', 'Área crítica cadastrada sem ponto de apoio vinculado — requer ação do gestor');

INSERT INTO iara_recurso_tipo (tipo_nome, tipo_desc) VALUES
    ('VIATURA',             'Veículo terrestre de resgate ou apoio'),
    ('BARCO',               'Embarcação para resgate em áreas inundadas'),
    ('HELICOPTERO',         'Aeronave para resgate ou reconhecimento aéreo'),
    ('GERADOR',             'Gerador de energia para suporte a operações'),
    ('MAQUINA_PESADA',      'Retroescavadeira, trator, caminhão de carga'),
    ('EQUIPAMENTO_RESGATE', 'Cordas, macas, detectores de vida'),
    ('TENDAS',              'Estruturas temporárias para abrigo ou triagem'),
    ('KIT_HUMANITARIO',     'Kit família pré-montado para distribuição imediata');

INSERT INTO iara_desastre_tipo (cobrade_cod, desastre_nome, desastre_desc) VALUES
    ('1.1.1.1.0', 'Enxurrada',             'Escoamento superficial de alta velocidade'),
    ('1.1.1.2.0', 'Alagamento',            'Extravasamento por drenagem insuficiente'),
    ('1.1.1.3.0', 'Inundação',             'Transbordamento além da calha normal de rios'),
    ('1.2.1.1.0', 'Deslizamento de Terra', 'Movimento de massa em encostas'),
    ('1.3.2.1.0', 'Incêndio Florestal',    'Incêndio em vegetação natural ou plantada'),
    ('1.4.1.1.0', 'Seca',                  'Estiagem prolongada com impacto em comunidades'),
    ('2.1.1.1.0', 'Desabamento',           'Colapso de estrutura física urbana'),
    ('2.3.1.1.0', 'Incêndio Urbano',       'Incêndio em área urbana ou edificações'),
    ('3.1.1.1.0', 'Crise Sanitária',       'Surto ou epidemia que exige resposta coletiva');

INSERT INTO iara_demanda_tipo (d_nome, d_desc) VALUES
    ('Alimento',       'Cestas básicas, água, alimentos não perecíveis'),
    ('Higiene',        'Itens de higiene pessoal e limpeza'),
    ('Medicamento',    'Medicamentos e insumos de saúde'),
    ('Vestuário',      'Roupas, calçados e cobertores'),
    ('Logística',      'Veículos, combustível, ferramentas'),
    ('Recurso Humano', 'Pessoas com ou sem especialidade técnica');

INSERT INTO iara_espec_categoria (id, cat_nome, cat_desc) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Saúde',            'Profissionais da área de saúde'),
    ('10000000-0000-0000-0000-000000000002', 'Assistência Social','Apoio social, psicológico e comunitário'),
    ('10000000-0000-0000-0000-000000000003', 'Engenharia',        'Avaliação estrutural e infraestrutura'),
    ('10000000-0000-0000-0000-000000000004', 'Segurança',         'Resgate, bombeiros e segurança pública'),
    ('10000000-0000-0000-0000-000000000005', 'Mobilidade',        'Transporte de pessoas e materiais'),
    ('10000000-0000-0000-0000-000000000006', 'Logística',         'Gestão de estoque e distribuição');

INSERT INTO iara_espec (id_categoria, espec_nome, espec_desc) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Médico Clínico Geral',  'Atendimento clínico de adultos'),
    ('10000000-0000-0000-0000-000000000001', 'Médico Pediatra',       'Atendimento clínico infantil'),
    ('10000000-0000-0000-0000-000000000001', 'Médico de Emergência',  'Atendimento de urgência e emergência'),
    ('10000000-0000-0000-0000-000000000001', 'Enfermeiro',            'Cuidados de enfermagem e triagem'),
    ('10000000-0000-0000-0000-000000000001', 'Técnico de Enfermagem', 'Suporte em procedimentos de enfermagem'),
    ('10000000-0000-0000-0000-000000000001', 'Farmacêutico',          'Gestão e dispensação de medicamentos'),
    ('10000000-0000-0000-0000-000000000002', 'Psicólogo',             'Suporte emocional a vítimas e equipes'),
    ('10000000-0000-0000-0000-000000000002', 'Assistente Social',     'Triagem e apoio social a famílias'),
    ('10000000-0000-0000-0000-000000000003', 'Engenheiro Civil',      'Avaliação estrutural de construções'),
    ('10000000-0000-0000-0000-000000000003', 'Geólogo',               'Análise de risco geológico'),
    ('10000000-0000-0000-0000-000000000004', 'Bombeiro Civil',        'Resgate e combate a incêndio'),
    ('10000000-0000-0000-0000-000000000004', 'Socorrista',            'Primeiros socorros e suporte básico de vida'),
    ('10000000-0000-0000-0000-000000000005', 'Motorista',             'Transporte de pessoas e donativos'),
    ('10000000-0000-0000-0000-000000000005', 'Operador de Barco',     'Navegação em áreas inundadas'),
    ('10000000-0000-0000-0000-000000000006', 'Logístico',             'Gestão de estoque e distribuição');


-- =============================================================================
-- SEÇÃO 13: TRIGGERS DE updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_updated_at          BEFORE UPDATE ON iara_tenant                 FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_usuario_updated_at         BEFORE UPDATE ON iara_usuario                FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_zona_risco_updated_at      BEFORE UPDATE ON iara_zona_risco             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_evento_updated_at          BEFORE UPDATE ON iara_evento                 FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_setor_operacao_updated_at  BEFORE UPDATE ON iara_setor_operacao         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_morgue_updated_at          BEFORE UPDATE ON iara_morgue                 FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_incidentes_updated_at      BEFORE UPDATE ON iara_incidentes             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_apoio_updated_at           BEFORE UPDATE ON iara_solicitacao_apoio      FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_evento_espec_updated_at    BEFORE UPDATE ON iara_evento_espec_necessaria FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_pc_updated_at              BEFORE UPDATE ON iara_pc                     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_pc_demanda_updated_at      BEFORE UPDATE ON iara_pc_demanda             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_pc_estoque_updated_at      BEFORE UPDATE ON iara_pc_estoque             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_doacao_intencao_updated_at BEFORE UPDATE ON iara_doacao_intencao        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_abrigo_updated_at          BEFORE UPDATE ON iara_abrigo                 FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_hospital_updated_at        BEFORE UPDATE ON iara_hospital               FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_recurso_dc_updated_at      BEFORE UPDATE ON iara_recurso_dc             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_local_abastec_updated_at   BEFORE UPDATE ON iara_local_abastecimento    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_ponto_atencao_updated_at   BEFORE UPDATE ON iara_ponto_atencao          FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_ponto_apoio_updated_at     BEFORE UPDATE ON iara_ponto_apoio             FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_infra_municipal_updated_at BEFORE UPDATE ON iara_infra_municipal         FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_solsrv_updated_at          BEFORE UPDATE ON iara_solicitacao_servico     FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();


-- =============================================================================
-- SEÇÃO 14: QUERIES DE REFERÊNCIA (PostGIS)
-- =============================================================================

-- 1. PCs ativos dentro do raio do evento (base do INSERT em iara_pc_evento)
-- SELECT pc.id, pc.pc_nome,
--        ROUND(ST_Distance(pc.pc_coords::geography, ev.coordenadas::geography)) AS dist_metros
-- FROM iara_pc pc CROSS JOIN iara_evento ev
-- WHERE ev.id = :id_evento AND pc.is_active = TRUE
--   AND ST_DWithin(pc.pc_coords::geography, ev.coordenadas::geography, ev.raio_metros)
-- ORDER BY dist_metros;

-- 2. Match de técnicos por especialidade necessária em um evento
-- SELECT u.id, u.nome, ec.cat_nome, e.espec_nome,
--        een.qtd_necessaria - een.qtd_alocada AS vagas_abertas,
--        ROUND(ST_Distance(u.localizacao::geography, ev.coordenadas::geography)) AS dist_metros
-- FROM iara_evento_espec_necessaria een
-- JOIN iara_espec e             ON e.id  = een.id_espec
-- JOIN iara_espec_categoria ec  ON ec.id = e.id_categoria
-- JOIN iara_usuario u           ON u.id_espec = een.id_espec
-- JOIN iara_role r              ON r.id = u.id_role AND r.role_nome = 'TECNICO'
-- CROSS JOIN iara_evento ev
-- WHERE ev.id = :id_evento AND een.id_evento = :id_evento
--   AND een.qtd_alocada < een.qtd_necessaria
--   AND u.is_active = TRUE AND u.esta_disponivel = TRUE AND u.cadastro_sts = 'APROVADO'
--   AND ST_DWithin(u.localizacao::geography, ev.coordenadas::geography, 20000)
-- ORDER BY vagas_abertas DESC, dist_metros;

-- 3. Geofencing: verificar se coordenada está em zona de risco ativa
-- SELECT zr.nome, zr.tipo, zr.nivel_risco
-- FROM iara_zona_risco zr
-- WHERE zr.is_active = TRUE
--   AND ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), zr.geometria);
-- (usa idx_zona_risco_geom_active — resposta em milissegundos no mobile)

-- 4. Verificar se coordenada está em zona quente (bloqueia checkin — RN19)
-- SELECT so.tipo FROM iara_setor_operacao so
-- WHERE so.id_evento = :id_evento AND so.tipo = 'QUENTE'
--   AND ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), so.geometria);

-- 5. Mural de necessidades: demandas não atendidas por prioridade (RF09)
-- SELECT dt.d_nome, d.descricao, d.qtd_solicitada - d.qtd_atendida AS qtd_faltante,
--        pc.pc_nome, d.prioridade
-- FROM iara_pc_demanda d
-- JOIN iara_demanda_tipo dt ON dt.id = d.id_tipo
-- JOIN iara_pc pc           ON pc.id = d.id_pc
-- WHERE d.id_evento = :id_evento AND d.is_active = TRUE AND d.qtd_atendida < d.qtd_solicitada
-- ORDER BY CASE d.prioridade
--   WHEN 'CRITICA' THEN 1 WHEN 'ALTA' THEN 2 WHEN 'MEDIA' THEN 3 WHEN 'BAIXA' THEN 4
-- END, dt.d_nome;

-- 6. Zonas de risco próximas ao ponto de um novo evento (sugestão automática)
-- SELECT zr.nome, zr.tipo, zr.nivel_risco,
--        ROUND(ST_Distance(ST_Centroid(zr.geometria)::geography,
--              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)) AS dist_metros
-- FROM iara_zona_risco zr
-- WHERE zr.is_active = TRUE
--   AND zr.id_tenant IN (SELECT id FROM iara_tenant WHERE id = :id_tenant OR id_pai = :id_tenant)
--   AND ST_DWithin(ST_Centroid(zr.geometria)::geography,
--                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 10000)
-- ORDER BY nivel_risco DESC, dist_metros;

-- 7. Hospitais próximos com leitos disponíveis
-- SELECT h.nome, h.tipo, h.leitos_disponiveis, h.leitos_uti_disp,
--        ROUND(ST_Distance(h.coordenadas::geography,
--              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)) AS dist_metros
-- FROM iara_hospital h
-- WHERE h.is_active = TRUE AND h.leitos_disponiveis > 0
--   AND ST_DWithin(h.coordenadas::geography,
--                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 30000)
-- ORDER BY dist_metros;

-- 8. Local de abastecimento mais próximo do técnico em campo (RN16)
-- SELECT la.nome, la.tipo, la.descricao_itens,
--        ROUND(ST_Distance(la.coordenadas::geography,
--              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)) AS dist_metros
-- FROM iara_local_abastecimento la
-- WHERE la.is_active = TRUE AND la.tipo IN ('COMBUSTIVEL','MISTO')
--   AND la.id_tenant IN (SELECT id FROM iara_tenant WHERE id = :id_tenant OR id_pai = :id_tenant)
--   AND ST_DWithin(la.coordenadas::geography,
--                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 30000)
-- ORDER BY dist_metros LIMIT 5;

-- 9. KPIs do dashboard por evento — exclui simulados (RF10)
-- SELECT ev.titulo, ev.severidade, ev.status,
--        SUM(d.qtd_solicitada)                                          AS total_solicitado,
--        SUM(d.qtd_atendida)                                            AS total_atendido,
--        ROUND(SUM(d.qtd_atendida)::numeric /
--              NULLIF(SUM(d.qtd_solicitada), 0) * 100, 1)              AS pct_atendimento
-- FROM iara_evento ev JOIN iara_pc_demanda d ON d.id_evento = ev.id
-- WHERE ev.id_tenant = :id_tenant AND ev.is_simulado = FALSE
-- GROUP BY ev.id, ev.titulo, ev.severidade, ev.status ORDER BY pct_atendimento ASC;

-- 10. Dashboard START: estado atual de cada vítima (RN13 — registro mais recente)
-- SELECT vt.codigo_campo, vt.nome_provisorio, vt.classificacao,
--        COUNT(*) OVER (PARTITION BY vt.codigo_campo) AS total_reavaliações
-- FROM iara_vitima_triagem vt
-- WHERE vt.id_evento = :id_evento
--   AND vt.created_at = (SELECT MAX(v2.created_at) FROM iara_vitima_triagem v2
--                        WHERE v2.codigo_campo = vt.codigo_campo AND v2.id_evento = vt.id_evento)
-- ORDER BY CASE vt.classificacao
--   WHEN 'VERMELHO' THEN 1 WHEN 'AMARELO' THEN 2 WHEN 'VERDE' THEN 3 WHEN 'PRETO' THEN 4 END;

-- 11. Validação FIDE antes de submissão S2ID (RN17) — retorna NULL se aprovado
-- SELECT CASE
--   WHEN ev.is_simulado          THEN 'Simulados não podem ser submetidos ao S2ID'
--   WHEN ev.cobrade_cod IS NULL  THEN 'Código COBRADE obrigatório'
--   WHEN ev.fide_pop_afetada IS NULL    THEN 'População afetada obrigatória'
--   WHEN ev.fide_danos_humanos_desc IS NULL THEN 'Descrição de danos humanos obrigatória'
--   WHEN ev.fide_prejuizo_publico IS NULL   THEN 'Prejuízo público (R$) obrigatório'
--   WHEN ev.fide_prejuizo_privado IS NULL   THEN 'Prejuízo privado (R$) obrigatório'
--   WHEN ev.fide_decreto_municipal IS NULL  THEN 'Decreto municipal obrigatório'
--   ELSE NULL
-- END AS motivo_bloqueio FROM iara_evento ev WHERE ev.id = :id_evento;

-- 12. Registros offline pendentes (job @Scheduled de sincronização)
-- SELECT 'checkin'  AS origem, id, created_at FROM iara_checkin       WHERE data_sincronizacao IS NULL
-- UNION ALL
-- SELECT 'informe',             id, created_at FROM iara_informe_campo WHERE data_sincronizacao IS NULL
-- UNION ALL
-- SELECT 'intencao',            id, created_at FROM iara_doacao_intencao WHERE data_sincronizacao IS NULL
-- UNION ALL
-- SELECT 'triagem',             id, created_at FROM iara_vitima_triagem WHERE data_sincronizacao IS NULL
-- UNION ALL
-- SELECT 'morgue',              id, created_at FROM iara_morgue         WHERE data_sincronizacao IS NULL
-- ORDER BY created_at ASC;

-- 13. Relatório morgue por evento (acesso restrito — MONITOR/GESTOR/ADMIN)
-- SELECT m.codigo_morgue, m.nome_identificado, m.descricao_local, m.local_remocao,
--        vt.classificacao AS triagem_start
-- FROM iara_morgue m
-- LEFT JOIN iara_vitima_triagem vt ON vt.id = m.id_triagem
-- WHERE m.id_evento = :id_evento ORDER BY m.created_at;

-- 14. Abrigos com vagas e prioritários em espera próximos ao evento
-- SELECT ab.nome, ab.capacidade_total - ab.ocupacao_atual AS vagas,
--        COUNT(ao.id) FILTER (WHERE ao.is_prioridade = TRUE) AS prioritarios_aguardando,
--        ROUND(ST_Distance(ab.coordenadas::geography, ev.coordenadas::geography)) AS dist_metros
-- FROM iara_abrigo ab
-- LEFT JOIN iara_abrigo_ocupante ao ON ao.id_abrigo = ab.id AND ao.data_saida IS NULL
-- CROSS JOIN iara_evento ev
-- WHERE ev.id = :id_evento AND ab.is_active = TRUE AND ab.ocupacao_atual < ab.capacidade_total
--   AND ST_DWithin(ab.coordenadas::geography, ev.coordenadas::geography, ev.raio_metros * 2)
-- GROUP BY ab.id, ab.nome, ab.capacidade_total, ab.ocupacao_atual, ab.coordenadas, ev.coordenadas
-- ORDER BY dist_metros;

-- 15. Pontos de Atenção próximos com todos os tipos de apoio pré-identificados (RN20/21)
-- Retorna PC, abrigo e pontos de apoio específicos vinculados a cada Ponto de Atenção.
-- SELECT pa.nome, pa.nivel_risco, pa.is_industrial, pa.substancia_perigosa_txt,
--        pa.populacao_estimada, pa.situacao_apoio,
--        ROUND(ST_Distance(pa.geometria::geography,
--              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)) AS dist_metros,
--        json_agg(DISTINCT jsonb_build_object(
--            'tipo',    CASE
--                           WHEN aa.id_pc          IS NOT NULL THEN 'PC'
--                           WHEN aa.id_abrigo       IS NOT NULL THEN 'ABRIGO'
--                           WHEN aa.id_ponto_apoio  IS NOT NULL THEN 'APOIO_ESPECIFICO'
--                       END,
--            'nome',    COALESCE(pc.pc_nome, ab.nome, pap.nome),
--            'contato', COALESCE(pc.pc_contato, ab.contato, pap.contato),
--            'observacao', aa.observacao
--        )) FILTER (WHERE aa.id IS NOT NULL) AS apoios
-- FROM iara_ponto_atencao pa
-- LEFT JOIN iara_atencao_apoio aa  ON aa.id_ponto_atencao = pa.id
-- LEFT JOIN iara_pc pc             ON pc.id  = aa.id_pc
-- LEFT JOIN iara_abrigo ab         ON ab.id  = aa.id_abrigo
-- LEFT JOIN iara_ponto_apoio pap   ON pap.id = aa.id_ponto_apoio
-- WHERE pa.is_active = TRUE
--   AND pa.id_tenant IN (SELECT id FROM iara_tenant WHERE id = :id_tenant OR id_pai = :id_tenant)
--   AND ST_DWithin(pa.geometria::geography,
--                 ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 5000)
-- GROUP BY pa.id ORDER BY dist_metros;

-- 16. Pontos de Atenção industriais ativos no tenant (RN23 — triagem de descontaminação)
-- SELECT pa.nome, pa.substancia_perigosa_txt, pa.classe_risco_industrial,
--        pa.nivel_risco, pa.populacao_estimada, pa.situacao_apoio,
--        array_agg(dt.desastre_nome) AS tipos_desastre
-- FROM iara_ponto_atencao pa
-- JOIN iara_atencao_desastre ad ON ad.id_ponto_atencao = pa.id
-- JOIN iara_desastre_tipo dt    ON dt.id = ad.id_desastre_tipo
-- WHERE pa.id_tenant = :id_tenant AND pa.is_active = TRUE AND pa.is_industrial = TRUE
-- GROUP BY pa.id ORDER BY pa.nivel_risco DESC;

-- 17. Solicitações de serviço abertas por tenant com contagem de fotos (RN26)
-- SELECT ss.tipo, ss.endereco_txt, ss.descricao_motivo, ss.status,
--        jsonb_array_length(ss.fotos_urls) AS qtd_fotos,
--        dg.url_pdf_s3, ss.created_at
-- FROM iara_solicitacao_servico ss
-- LEFT JOIN iara_documento_gerado dg ON dg.id_solicitacao = ss.id
--                                   AND dg.tipo_doc = 'FORMULARIO_VISTORIA'
-- WHERE ss.id_tenant = :id_tenant AND ss.status IN ('ABERTA','EM_TRIAGEM')
-- ORDER BY ss.created_at DESC;

-- 18. Infraestrutura municipal disponível próxima a um evento (RN27)
-- SELECT im.nome, im.tipo, im.contato_24h, im.capacidade_atendimento,
--        ROUND(ST_Distance(im.coordenadas::geography, ev.coordenadas::geography)) AS dist_metros
-- FROM iara_infra_municipal im CROSS JOIN iara_evento ev
-- WHERE ev.id = :id_evento AND im.is_active = TRUE
--   AND im.id_tenant IN (SELECT id FROM iara_tenant WHERE id = :id_tenant OR id_pai = :id_tenant)
--   AND ST_DWithin(im.coordenadas::geography, ev.coordenadas::geography, 20000)
-- ORDER BY im.tipo, dist_metros;

-- 19. Painel de controle: áreas críticas SEM ponto de apoio vinculado (RN21 — alerta gestão)
-- Usado pelo gestor para identificar e regularizar lacunas de cobertura.
-- Também é a base para o @Scheduled que dispara alertas do tipo SEM_PONTO_APOIO.
-- SELECT pa.id, pa.nome, pa.nivel_risco, pa.is_industrial,
--        pa.populacao_estimada, pa.created_at,
--        array_agg(dt.desastre_nome) AS tipos_risco
-- FROM iara_ponto_atencao pa
-- LEFT JOIN iara_atencao_desastre ad ON ad.id_ponto_atencao = pa.id
-- LEFT JOIN iara_desastre_tipo dt    ON dt.id = ad.id_desastre_tipo
-- WHERE pa.id_tenant = :id_tenant
--   AND pa.is_active = TRUE
--   AND pa.situacao_apoio = 'SEM_APOIO'
-- GROUP BY pa.id
-- ORDER BY pa.nivel_risco DESC, pa.populacao_estimada DESC NULLS LAST;
-- (usa idx_pa_sem_apoio — índice parcial, resposta rápida mesmo com muitos pontos cadastrados)