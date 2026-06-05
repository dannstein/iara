-- V9: Relaxa a constraint chk_tecnico_comprovacao para nao exigir doc_comprovacao_url.
--
-- Contexto: o storage de arquivos (S3/MinIO) ainda nao esta configurado. O service
-- salva url = null intencionalmente (ver TODO em UsuarioService.cadastrarTecnico).
-- A constraint original exigia os 3 campos juntos (id_espec + numero + url), o que
-- impedia o cadastro de voluntarios mesmo com numero de registro informado.
--
-- Quando o file storage for implementado, restaurar a condicao original:
--   (id_espec IS NOT NULL AND doc_comprovacao_numero IS NOT NULL AND doc_comprovacao_url IS NOT NULL)

ALTER TABLE iara_usuario DROP CONSTRAINT chk_tecnico_comprovacao;

ALTER TABLE iara_usuario
    ADD CONSTRAINT chk_tecnico_comprovacao CHECK (
        -- Sem especialidade: nenhum campo de comprovacao deve estar preenchido
        (id_espec IS NULL AND doc_comprovacao_numero IS NULL AND doc_comprovacao_url IS NULL)
        OR
        -- Com especialidade: numero de registro obrigatorio; url opcional ate o storage ser configurado
        -- TODO: adicionar "AND doc_comprovacao_url IS NOT NULL" quando o file storage estiver pronto
        (id_espec IS NOT NULL AND doc_comprovacao_numero IS NOT NULL)
    );
