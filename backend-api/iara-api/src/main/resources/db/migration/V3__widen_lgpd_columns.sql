-- =============================================================================
-- V3 — Alarga colunas LGPD:SENSIVEL para comportar texto cifrado (AES-256).
--
-- O ciphertext (Base64 de IV||GCM) é maior que o texto plano. Colunas estreitas
-- como documento VARCHAR(14) ou telefone VARCHAR(20) não cabem o valor cifrado.
-- Campos com criptografia DETERMINÍSTICA (email, documento) mantêm UNIQUE:
-- o mesmo valor plano gera sempre o mesmo ciphertext.
-- =============================================================================

-- iara_usuario
ALTER TABLE iara_usuario ALTER COLUMN nome                   TYPE VARCHAR(512);
ALTER TABLE iara_usuario ALTER COLUMN email                  TYPE VARCHAR(512);
ALTER TABLE iara_usuario ALTER COLUMN telefone               TYPE VARCHAR(512);
ALTER TABLE iara_usuario ALTER COLUMN documento              TYPE VARCHAR(512);
ALTER TABLE iara_usuario ALTER COLUMN doc_comprovacao_numero TYPE VARCHAR(512);

-- iara_abrigo_ocupante
ALTER TABLE iara_abrigo_ocupante ALTER COLUMN nome      TYPE VARCHAR(512);
ALTER TABLE iara_abrigo_ocupante ALTER COLUMN documento TYPE VARCHAR(512);

-- iara_morgue
ALTER TABLE iara_morgue ALTER COLUMN nome_identificado TYPE VARCHAR(512);
ALTER TABLE iara_morgue ALTER COLUMN documento         TYPE VARCHAR(512);

-- iara_recurso_dc_evento
ALTER TABLE iara_recurso_dc_evento ALTER COLUMN condutor_nome    TYPE VARCHAR(512);
ALTER TABLE iara_recurso_dc_evento ALTER COLUMN condutor_contato TYPE VARCHAR(512);
