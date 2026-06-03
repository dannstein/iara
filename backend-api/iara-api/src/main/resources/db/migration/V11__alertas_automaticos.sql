-- V11: Alertas automáticos (Fase 2D)
-- Cada regra tem id estável (string, definido no bean Java). O banco só armazena
-- estado de ativação por tenant + parâmetros de configuração + log de auditoria.

CREATE TABLE iara_alerta_automatico (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant       UUID            NOT NULL REFERENCES iara_tenant(id),
    rule_id         VARCHAR(80)     NOT NULL,
    is_ativo        BOOLEAN         NOT NULL DEFAULT FALSE,
    config          JSONB,
    activated_by    UUID            REFERENCES iara_usuario(id),
    activated_at    TIMESTAMPTZ,
    deactivated_by  UUID            REFERENCES iara_usuario(id),
    deactivated_at  TIMESTAMPTZ,
    UNIQUE (id_tenant, rule_id)
);

CREATE INDEX idx_auto_tenant_ativo
    ON iara_alerta_automatico (id_tenant, is_ativo);

CREATE INDEX idx_auto_rule_ativo
    ON iara_alerta_automatico (rule_id, is_ativo);

CREATE TABLE iara_alerta_automatico_log (
    id          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant   UUID            NOT NULL REFERENCES iara_tenant(id),
    rule_id     VARCHAR(80)     NOT NULL,
    acao        VARCHAR(20)     NOT NULL
        CHECK (acao IN ('ATIVADO','DESATIVADO','CONFIG_ALTERADO','DISPAROU','ERRO')),
    id_usuario  UUID            REFERENCES iara_usuario(id),
    id_alerta   UUID            REFERENCES iara_alerta(id),
    payload     JSONB,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auto_log_tenant_time
    ON iara_alerta_automatico_log (id_tenant, created_at DESC);

CREATE INDEX idx_auto_log_rule_time
    ON iara_alerta_automatico_log (rule_id, created_at DESC);
