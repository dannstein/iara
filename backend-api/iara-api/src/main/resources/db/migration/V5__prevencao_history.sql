-- =============================================================================
-- V5 — Prevenção: prioridade + histórico de transições para Solicitações de Serviço.
--
-- A solicitação do cidadão (relato preventivo com fotos) ganha uma prioridade
-- definida pelo gestor (BAIXA/MEDIA/ALTA/CRITICA) e um histórico que documenta
-- cada passo do atendimento — quem fez, quando, qual observação.
-- =============================================================================

ALTER TABLE iara_solicitacao_servico
    ADD COLUMN prioridade VARCHAR(20)
    CHECK (prioridade IS NULL OR prioridade IN ('BAIXA','MEDIA','ALTA','CRITICA'));

CREATE TABLE iara_solicitacao_historico (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_solicitacao  UUID NOT NULL REFERENCES iara_solicitacao_servico(id) ON DELETE CASCADE,
    status_para     VARCHAR(20) NOT NULL,
    observacao      TEXT,
    id_responsavel  UUID REFERENCES iara_usuario(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_solicitacao_historico_sol ON iara_solicitacao_historico (id_solicitacao);
CREATE INDEX idx_solicitacao_historico_dt  ON iara_solicitacao_historico (created_at DESC);

COMMENT ON TABLE iara_solicitacao_historico IS
    'Linha do tempo de atendimento de uma solicitação preventiva — cada transição/anotação do gestor.';
