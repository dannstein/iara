-- =============================================================================
-- V4 — Zonas de Risco com ponto+raio e registro standalone de Pontos de Apoio.
--
-- Conceito: "Ponto de Atenção" = "Zona de Risco" (área de risco ponto+raio).
-- Uma zona pode ter MUITOS pontos de apoio; um ponto de apoio atende NO MÁXIMO
-- uma zona (FK no ponto de apoio). Desativar a zona libera seus apoios
-- (ON DELETE SET NULL cobre exclusão; o serviço zera o vínculo na desativação).
-- =============================================================================

-- Zona de risco passa a aceitar o modelo ponto + raio (como evento).
ALTER TABLE iara_zona_risco ADD COLUMN raio_metros INT;

-- Registro standalone de pontos de apoio (infraestrutura).
CREATE TABLE iara_ponto_apoio_geral (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_tenant     UUID NOT NULL REFERENCES iara_tenant(id),
    nome          VARCHAR(200) NOT NULL,
    descricao     TEXT,
    geometria     GEOMETRY(Point, 4326) NOT NULL,
    contato       VARCHAR(100),
    responsavel   VARCHAR(150),
    endereco_txt  VARCHAR(500),
    -- Vínculo opcional: este apoio atende, no máximo, uma zona de risco.
    id_zona_risco UUID REFERENCES iara_zona_risco(id) ON DELETE SET NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ponto_apoio_geral_geom   ON iara_ponto_apoio_geral USING GIST (geometria);
CREATE INDEX idx_ponto_apoio_geral_tenant ON iara_ponto_apoio_geral (id_tenant);
CREATE INDEX idx_ponto_apoio_geral_zona   ON iara_ponto_apoio_geral (id_zona_risco);

COMMENT ON TABLE iara_ponto_apoio_geral IS
    'Ponto de apoio standalone (infra). Atende no máximo uma zona de risco (id_zona_risco).';
