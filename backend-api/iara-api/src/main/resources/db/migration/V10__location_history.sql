-- V10: Histórico de localização dos usuários (Fase 2C)
-- Suporta novos geofence modes: PASSED_THROUGH (passou pela área nas últimas X horas)
-- e FREQUENT (frequentemente presente na área).
-- Retenção: 7 dias (job diário de cleanup).
-- Volume potencialmente alto -> BIGSERIAL como id, sem UUID overhead.

CREATE TABLE iara_usuario_localizacao_historico (
    id          BIGSERIAL                 PRIMARY KEY,
    id_usuario  UUID                      NOT NULL REFERENCES iara_usuario(id) ON DELETE CASCADE,
    coordenadas GEOMETRY(Point, 4326)     NOT NULL,
    captured_at TIMESTAMPTZ               NOT NULL
);

CREATE INDEX idx_loc_hist_user_time
    ON iara_usuario_localizacao_historico (id_usuario, captured_at DESC);

CREATE INDEX idx_loc_hist_coord
    ON iara_usuario_localizacao_historico USING GIST (coordenadas);

CREATE INDEX idx_loc_hist_captured_at
    ON iara_usuario_localizacao_historico (captured_at);
