-- V17 — Sub-fase 4B do plano do Ponto de Coleta:
--   * Motivos predefinidos de recusa de PcEvento (catálogo).
--   * Optimistic locking @Version em PcEvento.
--   * Tabela iara_worker_evento_disponibilidade — fila de confirmação dos workers
--     do PC para cada evento que o coordenador aceitou.

-- ============================================================================
-- 1. Catálogo de motivos de recusa
-- ============================================================================
CREATE TABLE iara_pc_motivo_recusa (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(40) UNIQUE NOT NULL,
    label               VARCHAR(150) NOT NULL,
    exige_descricao     BOOLEAN NOT NULL DEFAULT FALSE,
    ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed inicial. Codigo é o identificador estável (usado por integrações).
INSERT INTO iara_pc_motivo_recusa (codigo, label, exige_descricao) VALUES
    ('SEM_PESSOAL',           'Sem pessoal disponível',                    FALSE),
    ('SEM_ESPACO',            'Sem espaço físico disponível',              FALSE),
    ('EM_MANUTENCAO',         'Em manutenção',                             FALSE),
    ('FORA_HORARIO',          'Fora do horário de funcionamento',          FALSE),
    ('FERIADO',               'Feriado / dia não operacional',             FALSE),
    ('INFRAESTRUTURA_AFETADA','Infraestrutura afetada pelo desastre',     FALSE),
    ('FORA_AREA_ATUACAO',     'Fora da área de atuação do PC',             FALSE),
    ('OUTRO',                 'Outro motivo',                              TRUE);

-- ============================================================================
-- 2. Optimistic locking + motivo de recusa em PcEvento
-- ============================================================================
ALTER TABLE iara_pc_evento
    ADD COLUMN id_motivo_recusa UUID REFERENCES iara_pc_motivo_recusa(id),
    ADD COLUMN motivo_recusa_descricao TEXT,
    ADD COLUMN version INT NOT NULL DEFAULT 0;

-- ============================================================================
-- 3. Disponibilidade per-evento dos workers
-- ============================================================================
CREATE TABLE iara_worker_evento_disponibilidade (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pc_evento         UUID NOT NULL REFERENCES iara_pc_evento(id) ON DELETE CASCADE,
    id_usuario           UUID NOT NULL REFERENCES iara_usuario(id),
    status               VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
                         CHECK (status IN ('PENDENTE','CONFIRMADA','RECUSADA','EXPIRADA')),
    id_motivo_recusa     UUID REFERENCES iara_pc_motivo_recusa(id),
    motivo_descricao     TEXT,
    data_solicitacao     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_resposta        TIMESTAMPTZ,
    version              INT NOT NULL DEFAULT 0,
    UNIQUE (id_pc_evento, id_usuario)
);

CREATE INDEX idx_worker_disp_usuario_status
    ON iara_worker_evento_disponibilidade (id_usuario, status);
CREATE INDEX idx_worker_disp_pc_evento
    ON iara_worker_evento_disponibilidade (id_pc_evento, status);
