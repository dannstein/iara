package br.com.iara.iara_api.service.automatico;

import br.com.iara.iara_api.dto.alerta.AlertaDTO;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Contrato de uma regra de alerta automático. Implementações são
 * descobertas como beans Spring (@Component) e registradas em
 * {@link AlertaAutomaticoRegistry} ao subir a aplicação.
 *
 * O id da regra é estável e referenciado pelo banco (iara_alerta_automatico.rule_id);
 * mudar o id de uma regra existente quebra os estados de ativação por tenant.
 */
public interface IAlertaAutomaticoRule {

    /** Identificador estável da regra (NUNCA renomear depois de em produção). */
    String id();

    /** Nome amigável mostrado na UI. */
    String displayName();

    /** Descrição que aparece como subtítulo no card da UI. */
    String description();

    /** Classe do evento Spring que dispara a regra. */
    Class<?> triggerEventClass();

    /** Lista de parâmetros configuráveis. UI gera o formulário. */
    List<RuleParameter> parameters();

    /**
     * Executa a regra. Retorna o alerta criado para logging (ou null se nada
     * foi criado por filtro interno — ex: condição não atingida).
     */
    AlertaDTO apply(Object event, Map<String, Object> config, UUID tenantId);
}
