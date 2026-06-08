-- V16 — Sub-fase 4A do plano do Ponto de Coleta:
--  - PC ganha statusVerificacao + motivoRejeicao para suportar o fluxo
--    "coordenador se cadastra com endereço → PC criado em PENDENTE_VERIFICACAO_GESTOR".
--  - 1 PC ativo por coordenador (índice parcial único).
--
-- Endereço passa a ser obrigatório para PCs novos, mas a validação fica no
-- service para não rejeitar PCs legados que possam ter id_endereco NULL.

ALTER TABLE iara_pc
    ADD COLUMN status_verificacao VARCHAR(30) NOT NULL DEFAULT 'VERIFICADO',
    ADD COLUMN motivo_rejeicao TEXT;

ALTER TABLE iara_pc
    ADD CONSTRAINT chk_pc_status_verificacao CHECK (
        status_verificacao IN ('PENDENTE_VERIFICACAO_GESTOR', 'VERIFICADO', 'REJEITADO')
    );

-- Cleanup de dados legados: se algum coordenador já tem >1 PC ativo (dados de teste),
-- desativa os mais antigos, mantendo só o mais recente. Necessário antes do índice.
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY id_coordenador
               ORDER BY created_at DESC, id
           ) AS rn
    FROM iara_pc
    WHERE is_active = TRUE
)
UPDATE iara_pc
SET is_active = FALSE
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 1 PC ativo por coordenador. Índice parcial: PCs inativos não contam.
CREATE UNIQUE INDEX uq_pc_coordenador_ativo
    ON iara_pc (id_coordenador)
    WHERE is_active = TRUE;

-- Backfill: pcs já verificados (pc_is_verified=true) ficam VERIFICADO; demais ficam
-- VERIFICADO também (default), pois nasceram antes do fluxo novo e o sistema antigo
-- considerava todos válidos.
-- Note: nada a fazer no UPDATE; default já cobre todos os existentes.
