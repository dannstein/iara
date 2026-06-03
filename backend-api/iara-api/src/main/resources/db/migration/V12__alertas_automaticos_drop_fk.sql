-- V12: solta o FK iara_alerta_automatico_log.id_alerta -> iara_alerta.
-- O log de auditoria é gravado por uma transação REQUIRES_NEW iniciada dentro
-- de um @TransactionalEventListener(AFTER_COMMIT). Em alguns cenários (commits
-- aninhados), a row de iara_alerta criada pela própria regra ainda não está
-- visível para uma nova transação, gerando FK violation. Como a tabela de log
-- é puramente auditoria, abandonar o FK simplifica o ciclo de vida sem perder
-- informação útil (o id continua sendo gravado).

ALTER TABLE iara_alerta_automatico_log
    DROP CONSTRAINT IF EXISTS iara_alerta_automatico_log_id_alerta_fkey;
