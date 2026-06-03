-- V13: Preferências de notificação por usuário (Fase 3A)
-- Cada usuário pode silenciar categorias e severidades específicas. O default
-- é receber tudo; só registramos opt-outs explícitos.

CREATE TABLE iara_usuario_notificacao_pref (
    id_usuario              UUID PRIMARY KEY REFERENCES iara_usuario(id) ON DELETE CASCADE,
    -- CSVs simples de categorias/severidades silenciadas. Strings curtas e o
    -- volume é baixíssimo (1 row por usuário); não vale a pena normalizar.
    categorias_silenciadas  TEXT,           -- ex: "DANGER_ZONE,SUPPORT_POINTS"
    severidades_silenciadas TEXT,           -- ex: "INFO,WARNING"
    -- Modo "não perturbe": silencia tudo exceto severidade EMERGENCY.
    nao_perturbe            BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
