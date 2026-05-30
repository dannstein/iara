-- =============================================================================
-- V7 — Alerta cooldown merge mode
-- Quando um cooldown bloqueia um novo alerta idêntico, ele é mesclado ao existente:
-- merged_count++ e data_expiracao estendida em 30 min.
-- =============================================================================

ALTER TABLE iara_alerta
  ADD COLUMN merged_count INT NOT NULL DEFAULT 0;

COMMENT ON COLUMN iara_alerta.merged_count IS
  'Quantas vezes este alerta absorveu duplicatas de cooldown (1F.3).';
