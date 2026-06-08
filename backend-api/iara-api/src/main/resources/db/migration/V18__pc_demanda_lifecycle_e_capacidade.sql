-- V18 — Sub-fase 4C do plano do Ponto de Coleta:
--   * PcDemanda ganha lifecycle status (OPEN/PARTIALLY_FULFILLED/FULFILLED/CLOSED) +
--     qtd_recebida, qtd_intencionada, qtd_maxima_capacidade, fechamento, @Version.
--   * Tabela iara_pc_capacidade — limites máximos por (PC, tipo).
--   * PcEstoque ganha @Version (otimistic locking).

-- ============================================================================
-- 1. PcDemanda — lifecycle status + tracking quantitativo
-- ============================================================================
ALTER TABLE iara_pc_demanda
    ADD COLUMN status              VARCHAR(30)  NOT NULL DEFAULT 'OPEN',
    ADD COLUMN qtd_recebida        INT          NOT NULL DEFAULT 0,
    ADD COLUMN qtd_intencionada    INT          NOT NULL DEFAULT 0,
    ADD COLUMN qtd_maxima_capacidade INT,
    ADD COLUMN data_fechamento     TIMESTAMPTZ,
    ADD COLUMN id_usu_fechou       UUID REFERENCES iara_usuario(id),
    ADD COLUMN version             INT          NOT NULL DEFAULT 0;

ALTER TABLE iara_pc_demanda
    ADD CONSTRAINT chk_pc_demanda_status CHECK (
        status IN ('OPEN','PARTIALLY_FULFILLED','FULFILLED','CLOSED')
    );

-- Backfill: demandas existentes que já estão atendidas (qtd_atendida >= qtd_solicitada)
-- entram como FULFILLED; demais como OPEN. qtd_recebida é o tracking real → herda qtd_atendida.
UPDATE iara_pc_demanda
SET qtd_recebida = qtd_atendida,
    status       = CASE
                       WHEN qtd_atendida >= qtd_solicitada THEN 'FULFILLED'
                       WHEN qtd_atendida > 0               THEN 'PARTIALLY_FULFILLED'
                       ELSE 'OPEN'
                   END;

CREATE INDEX idx_pc_demanda_status ON iara_pc_demanda (status) WHERE is_active = TRUE;

-- ============================================================================
-- 2. PcCapacidade — limite máximo default por (PC, tipo)
-- ============================================================================
CREATE TABLE iara_pc_capacidade (
    id_pc        UUID NOT NULL REFERENCES iara_pc(id) ON DELETE CASCADE,
    id_tipo      UUID NOT NULL REFERENCES iara_demanda_tipo(id) ON DELETE CASCADE,
    qtd_maxima   INT  NOT NULL CHECK (qtd_maxima > 0),
    alterado_por UUID REFERENCES iara_usuario(id),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version      INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id_pc, id_tipo)
);

-- ============================================================================
-- 3. PcEstoque — optimistic locking
-- ============================================================================
ALTER TABLE iara_pc_estoque
    ADD COLUMN version INT NOT NULL DEFAULT 0;
