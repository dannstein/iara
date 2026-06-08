-- V21 — Sub-fase 4F: audit log do PC (append-only, RULES bloqueiam UPDATE/DELETE).

CREATE TABLE iara_pc_audit_log (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_pc       UUID NOT NULL REFERENCES iara_pc(id) ON DELETE CASCADE,
    id_evento   UUID REFERENCES iara_evento(id),
    id_ator     UUID NOT NULL REFERENCES iara_usuario(id),
    acao        VARCHAR(50) NOT NULL,
    payload     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pc_audit_pc_tempo   ON iara_pc_audit_log (id_pc, created_at DESC);
CREATE INDEX idx_pc_audit_pc_ator    ON iara_pc_audit_log (id_pc, id_ator, created_at DESC);
CREATE INDEX idx_pc_audit_evento     ON iara_pc_audit_log (id_evento, created_at DESC);

CREATE RULE iara_pc_audit_no_update AS ON UPDATE TO iara_pc_audit_log DO INSTEAD NOTHING;
CREATE RULE iara_pc_audit_no_delete AS ON DELETE TO iara_pc_audit_log DO INSTEAD NOTHING;
