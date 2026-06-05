-- V15: Relaxa a constraint chk_tecnico_comprovacao
--
-- A constraint original (V1) exigia que doc_comprovacao_url fosse NOT NULL
-- sempre que id_espec e doc_comprovacao_numero estivessem populados. Isso
-- impede o cadastro de técnicos enquanto o storage de arquivos não estiver
-- configurado (TODO comentado em UsuarioService.cadastrarTecnico).
--
-- A nova regra mantém a consistência interna do par (espec, número de
-- comprovação) — ambos NULL ou ambos NOT NULL — mas torna doc_comprovacao_url
-- opcional. Quando o storage entrar no ar, o gestor poderá pedir que o
-- técnico anexe o documento via /usuarios/me ou via tela de aprovação.

ALTER TABLE iara_usuario
    DROP CONSTRAINT IF EXISTS chk_tecnico_comprovacao;

ALTER TABLE iara_usuario
    ADD CONSTRAINT chk_tecnico_comprovacao CHECK (
        (id_espec IS NULL     AND doc_comprovacao_numero IS NULL)
        OR
        (id_espec IS NOT NULL AND doc_comprovacao_numero IS NOT NULL)
    );
