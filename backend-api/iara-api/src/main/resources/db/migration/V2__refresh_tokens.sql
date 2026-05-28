CREATE TABLE iara_refresh_token (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(512) NOT NULL UNIQUE,
    id_usuario  UUID         NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    family_id   UUID         NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    is_revoked  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_iara_refresh_token_usuario ON iara_refresh_token(id_usuario);
CREATE INDEX idx_iara_refresh_token_family  ON iara_refresh_token(family_id);