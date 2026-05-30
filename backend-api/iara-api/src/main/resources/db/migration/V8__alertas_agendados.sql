-- =============================================================================
-- V8 — Alertas Agendados (Fase 2A)
-- Permite gestores agendar alertas para datas futuras com recorrência opcional.
-- Um job @Scheduled examina proxima_execucao a cada 30s e dispara os devidos.
-- =============================================================================

CREATE TABLE iara_alerta_agendado (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant           UUID NOT NULL REFERENCES iara_tenant(id),
    id_usu_criou        UUID NOT NULL REFERENCES iara_usuario(id),
    nome                VARCHAR(200) NOT NULL,
    categoria           VARCHAR(30) NOT NULL
        CHECK (categoria IN ('DANGER_ZONE','EVENT_ZONE','TENANT_BROADCAST','TECHNICAL_REQUEST',
                             'SUPPORT_POINTS','COLLECTION_POINTS','MONITORS','PERSONALIZED')),
    payload             JSONB NOT NULL,
    -- Schedule
    tipo_recorrencia    VARCHAR(20) NOT NULL
        CHECK (tipo_recorrencia IN ('ONE_TIME','DAILY','WEEKLY','MONTHLY','HOURLY')),
    inicio              TIMESTAMPTZ NOT NULL,
    fim                 TIMESTAMPTZ,
    horario             TIME,
    dia_semana          INT CHECK (dia_semana IS NULL OR dia_semana BETWEEN 0 AND 6),
    dia_mes             INT CHECK (dia_mes IS NULL OR dia_mes BETWEEN 1 AND 31),
    intervalo_horas     INT,
    -- Estado
    is_ativo            BOOLEAN NOT NULL DEFAULT TRUE,
    ultima_execucao     TIMESTAMPTZ,
    proxima_execucao    TIMESTAMPTZ NOT NULL,
    total_disparos      INT NOT NULL DEFAULT 0,
    ultimo_erro         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agendado_proximo ON iara_alerta_agendado (proxima_execucao) WHERE is_ativo;
CREATE INDEX idx_agendado_tenant  ON iara_alerta_agendado (id_tenant);
CREATE INDEX idx_agendado_criou   ON iara_alerta_agendado (id_usu_criou);

COMMENT ON TABLE iara_alerta_agendado IS
  'Alertas agendados para disparo futuro com recorrência opcional (Fase 2A).';
COMMENT ON COLUMN iara_alerta_agendado.payload IS
  'Request body da categoria, serializado como JSON. Validado no momento do disparo.';
COMMENT ON COLUMN iara_alerta_agendado.proxima_execucao IS
  'Próximo timestamp em que o scheduler deve disparar este agendamento. NULL após ONE_TIME concluído ou fim atingido.';
