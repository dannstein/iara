-- =============================================================================
-- V6 — Sistema de Alertas Fase 1 (MVP)
-- Expansão de iara_alerta + novas tabelas de delivery tracking e escalation log
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Expansão de iara_alerta
-- -----------------------------------------------------------------------------
ALTER TABLE iara_alerta
  ADD COLUMN titulo                  VARCHAR(200),
  ADD COLUMN severidade              VARCHAR(20) NOT NULL DEFAULT 'INFO'
    CHECK (severidade IN ('INFO','WARNING','DANGER','CRITICAL','EMERGENCY','SOLICITATION','OPERATIONAL')),
  ADD COLUMN status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE','EXPIRED','RESOLVED','CANCELLED','SUPERSEDED')),
  ADD COLUMN categoria               VARCHAR(30) NOT NULL DEFAULT 'PERSONALIZED'
    CHECK (categoria IN ('DANGER_ZONE','EVENT_ZONE','TENANT_BROADCAST','TECHNICAL_REQUEST',
                         'SUPPORT_POINTS','COLLECTION_POINTS','MONITORS','PERSONALIZED','ESCALATION')),
  ADD COLUMN target_role             VARCHAR(20),
  ADD COLUMN id_zona_risco           UUID REFERENCES iara_zona_risco(id) ON DELETE SET NULL,
  ADD COLUMN coordenadas             GEOMETRY(Point, 4326),
  ADD COLUMN raio_metros             INTEGER,
  ADD COLUMN geofence_modes          VARCHAR(200),
  ADD COLUMN data_expiracao          TIMESTAMPTZ,
  ADD COLUMN auto_expire_minutes     INTEGER,
  ADD COLUMN data_resolvido          TIMESTAMPTZ,
  ADD COLUMN id_usu_resolveu         UUID REFERENCES iara_usuario(id),
  ADD COLUMN requer_ack              BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN ack_minimo              INTEGER,
  ADD COLUMN is_escalation           BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN escalation_motivo       TEXT,
  ADD COLUMN escalation_from_tenant  UUID REFERENCES iara_tenant(id),
  ADD COLUMN total_destinatarios     INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN iara_alerta.severidade IS 'INFO|WARNING|DANGER|CRITICAL|EMERGENCY|SOLICITATION|OPERATIONAL';
COMMENT ON COLUMN iara_alerta.status IS 'ACTIVE|EXPIRED|RESOLVED|CANCELLED|SUPERSEDED';
COMMENT ON COLUMN iara_alerta.categoria IS 'Categoria do alerta — define forma de targeting';
COMMENT ON COLUMN iara_alerta.geofence_modes IS 'CSV: INSIDE,NEAR,HOME,WORK';

CREATE INDEX idx_alerta_status_severidade ON iara_alerta (status, severidade);
CREATE INDEX idx_alerta_categoria         ON iara_alerta (categoria);
CREATE INDEX idx_alerta_expira            ON iara_alerta (data_expiracao) WHERE status = 'ACTIVE';
CREATE INDEX idx_alerta_coord             ON iara_alerta USING GIST (coordenadas);
CREATE INDEX idx_alerta_zona              ON iara_alerta (id_zona_risco);

-- -----------------------------------------------------------------------------
-- 2) Destinatários individuais (delivery tracking + ack)
-- -----------------------------------------------------------------------------
CREATE TABLE iara_alerta_destinatario (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_alerta       UUID NOT NULL REFERENCES iara_alerta(id) ON DELETE CASCADE,
    id_usuario      UUID NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'SENT'
        CHECK (delivery_status IN ('SENT','DELIVERED','VISUALIZED','ACKNOWLEDGED','RESPONDED','FAILED')),
    response        VARCHAR(20)
        CHECK (response IS NULL OR response IN ('ACCEPT','REFUSE','UNAVAILABLE')),
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at    TIMESTAMPTZ,
    visualized_at   TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    responded_at    TIMESTAMPTZ,
    failure_reason  TEXT,
    UNIQUE (id_alerta, id_usuario)
);
CREATE INDEX idx_dest_alerta  ON iara_alerta_destinatario (id_alerta, delivery_status);
CREATE INDEX idx_dest_usuario ON iara_alerta_destinatario (id_usuario, sent_at DESC);

COMMENT ON TABLE iara_alerta_destinatario IS 'Rastreamento de entrega por usuário-alvo de um alerta';

-- -----------------------------------------------------------------------------
-- 3) Audit log de escalonamento (LGPD/compliance)
-- -----------------------------------------------------------------------------
CREATE TABLE iara_alerta_escalation_log (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_alerta      UUID NOT NULL REFERENCES iara_alerta(id) ON DELETE CASCADE,
    id_usu_escalou UUID NOT NULL REFERENCES iara_usuario(id),
    from_tenant    UUID NOT NULL REFERENCES iara_tenant(id),
    to_tenant      UUID NOT NULL REFERENCES iara_tenant(id),
    motivo         TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_esc_log_alerta  ON iara_alerta_escalation_log (id_alerta);
CREATE INDEX idx_esc_log_usuario ON iara_alerta_escalation_log (id_usu_escalou, created_at DESC);

COMMENT ON TABLE iara_alerta_escalation_log IS 'Log permanente de escalonamento de alertas para tenants ancestrais';

-- -----------------------------------------------------------------------------
-- 4) Seed: novos tipos de alerta para as 7 categorias da Fase 1
-- -----------------------------------------------------------------------------
INSERT INTO iara_alerta_tipo (tipo_nome, tipo_desc) VALUES
    ('DANGER_ZONE_USERS',       'Alerta para usuários em/perto de uma zona de risco'),
    ('EVENT_ZONE_USERS',        'Alerta para usuários em/perto de uma zona de evento'),
    ('TENANT_BROADCAST',        'Alerta amplo a todos os usuários de um tenant'),
    ('TECHNICAL_REQUEST',       'Solicitação de técnicos voluntários para um evento'),
    ('SUPPORT_POINTS_ALERT',    'Aviso a pontos de apoio sobre risco iminente'),
    ('COLLECTION_POINTS_ALERT', 'Aviso a pontos de coleta sobre evento/preparação'),
    ('MONITORS_ALERT',          'Comunicação direcionada a monitores de campo'),
    ('ESCALATION',              'Alerta escalado para tenant ancestral (emergência)'),
    ('PERSONALIZED',            'Alerta personalizado livre')
ON CONFLICT (tipo_nome) DO NOTHING;
