-- =============================================================================
-- V9 — Auto Radius Expansion para alertas TECHNICAL_REQUEST (Fase 2B)
-- Permite escalar o raio incrementalmente quando aceites < ackMinimo após X minutos.
-- =============================================================================

ALTER TABLE iara_alerta
  ADD COLUMN expansion_radii_metros TEXT,
  ADD COLUMN expansion_window_minutes INT,
  ADD COLUMN current_expansion_step INT NOT NULL DEFAULT 0,
  ADD COLUMN last_expansion_at TIMESTAMPTZ;

COMMENT ON COLUMN iara_alerta.expansion_radii_metros IS
  'CSV de raios em metros para expansão sequencial. Ex: "5000,10000,20000". NULL = sem expansão.';
COMMENT ON COLUMN iara_alerta.expansion_window_minutes IS
  'Minutos a aguardar entre tentativas de expansão. Default 5 quando expansion configurada.';
COMMENT ON COLUMN iara_alerta.current_expansion_step IS
  'Índice 0-based no array expansion_radii_metros. 0=raio inicial, n=último passo aplicado.';
COMMENT ON COLUMN iara_alerta.last_expansion_at IS
  'Timestamp da última expansão (ou da criação se step=0). Usado para janela.';

CREATE INDEX idx_alerta_expand
  ON iara_alerta (status, requer_ack, current_expansion_step)
  WHERE status = 'ACTIVE'
    AND requer_ack = true
    AND expansion_radii_metros IS NOT NULL;
