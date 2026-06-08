-- V19 — Sub-fase 4D do plano do Ponto de Coleta:
--   * DoacaoIntencao ganha qtd_recebida, data_expiracao, version, status EXPIRADA.
--   * Tabela iara_inventory_transaction (append-only).

-- ============================================================================
-- 1. DoacaoIntencao — tracking + expiração
-- ============================================================================
ALTER TABLE iara_doacao_intencao
    ADD COLUMN qtd_recebida   INT          NOT NULL DEFAULT 0,
    ADD COLUMN data_expiracao TIMESTAMPTZ,
    ADD COLUMN version        INT          NOT NULL DEFAULT 0;

-- Estende o CHECK de status para incluir EXPIRADA. O CHECK original definia
-- (PENDENTE|CONFIRMADA|CANCELADA). Como não temos o nome do constraint no V1,
-- recriamos via DROP/ADD pelo nome convencional.
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'iara_doacao_intencao'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%';
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE iara_doacao_intencao DROP CONSTRAINT %I', constraint_name);
    END IF;
END$$;

ALTER TABLE iara_doacao_intencao
    ADD CONSTRAINT chk_doacao_intencao_status CHECK (
        status IN ('PENDENTE','CONFIRMADA','CANCELADA','EXPIRADA')
    );

-- Backfill: data_expiracao para intenções PENDENTE existentes (created_at + 48h).
UPDATE iara_doacao_intencao
SET data_expiracao = created_at + INTERVAL '48 hours'
WHERE status = 'PENDENTE' AND data_expiracao IS NULL;

CREATE INDEX idx_doacao_intencao_expira
    ON iara_doacao_intencao (data_expiracao)
    WHERE status = 'PENDENTE';

-- ============================================================================
-- 2. iara_inventory_transaction — append-only
-- ============================================================================
CREATE TABLE iara_inventory_transaction (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pc        UUID NOT NULL REFERENCES iara_pc(id),
    id_evento    UUID REFERENCES iara_evento(id),
    id_tipo      UUID NOT NULL REFERENCES iara_demanda_tipo(id),
    operacao     VARCHAR(30) NOT NULL,
    quantidade   INT NOT NULL,
    id_usuario   UUID NOT NULL REFERENCES iara_usuario(id),
    id_intencao  UUID REFERENCES iara_doacao_intencao(id),
    id_demanda   UUID REFERENCES iara_pc_demanda(id),
    observacao   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_inv_operacao CHECK (operacao IN (
        'INTENT_CREATED','INTENT_CANCELLED','INTENT_EXPIRED',
        'RECEIVED','DISTRIBUTED','ADJUSTED','RESET_END_EVENT'
    ))
);
CREATE INDEX idx_inv_tx_pc_tempo    ON iara_inventory_transaction (id_pc, created_at DESC);
CREATE INDEX idx_inv_tx_evento_pc   ON iara_inventory_transaction (id_evento, id_pc);
CREATE INDEX idx_inv_tx_intencao    ON iara_inventory_transaction (id_intencao);

-- Imutabilidade: revoga UPDATE e DELETE da tabela. INSERT continua liberado
-- (qualquer role com permissão de schema). RULE bloqueia UPDATE/DELETE
-- mesmo para o owner — defesa em profundidade.
CREATE RULE iara_inv_no_update AS ON UPDATE TO iara_inventory_transaction DO INSTEAD NOTHING;
CREATE RULE iara_inv_no_delete AS ON DELETE TO iara_inventory_transaction DO INSTEAD NOTHING;
