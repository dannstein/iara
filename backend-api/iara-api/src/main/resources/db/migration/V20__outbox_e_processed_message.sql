-- V20 — Sub-fase 4E do plano do Ponto de Coleta:
-- Transactional Outbox Pattern para os eventos novos do PC + tabela de
-- idempotency consumida pelos consumers (24h de retenção, cleanup diário).

-- ============================================================================
-- 1. iara_outbox_event — fila persistente para o poller
-- ============================================================================
CREATE TABLE iara_outbox_event (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type      VARCHAR(80)  NOT NULL,
    aggregate_id    UUID         NOT NULL,
    aggregate_type  VARCHAR(40),
    payload         JSONB        NOT NULL,
    routing_key     VARCHAR(100) NOT NULL,
    message_id      UUID         NOT NULL UNIQUE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    attempts        INT          NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_error      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    CONSTRAINT chk_outbox_status CHECK (
        status IN ('PENDING','PUBLISHED','PERMANENTLY_FAILED')
    )
);

-- Índice usado pelo poller — restringe a PENDING para custo mínimo.
CREATE INDEX idx_outbox_pending
    ON iara_outbox_event (next_attempt_at)
    WHERE status = 'PENDING';

-- ============================================================================
-- 2. iara_processed_message — dedup para consumers idempotentes
-- ============================================================================
CREATE TABLE iara_processed_message (
    message_id    UUID         NOT NULL,
    consumer      VARCHAR(60)  NOT NULL,
    processed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, consumer)
);

-- Cleanup é responsabilidade de um job diário (ProcessedMessageCleanupJob).
CREATE INDEX idx_processed_message_processed
    ON iara_processed_message (processed_at);
