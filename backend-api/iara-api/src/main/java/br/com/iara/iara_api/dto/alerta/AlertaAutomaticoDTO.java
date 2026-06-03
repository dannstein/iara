package br.com.iara.iara_api.dto.alerta;

import br.com.iara.iara_api.domain.AlertaAutomatico;
import br.com.iara.iara_api.service.automatico.IAlertaAutomaticoRule;
import br.com.iara.iara_api.service.automatico.RuleParameter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO consolidado: combina a definição estática da regra (id, displayName, parameters)
 * com o estado de ativação no tenant atual (ativo, config, ativadoPor, ativadoEm).
 */
public record AlertaAutomaticoDTO(
        String ruleId,
        String displayName,
        String description,
        String triggerEvent,
        List<RuleParameter> parameters,
        boolean ativo,
        Map<String, Object> config,
        UUID activatedBy,
        OffsetDateTime activatedAt,
        OffsetDateTime deactivatedAt
) {
    public static AlertaAutomaticoDTO from(IAlertaAutomaticoRule rule, AlertaAutomatico activation) {
        boolean ativo = activation != null && activation.isAtivo();
        return new AlertaAutomaticoDTO(
                rule.id(),
                rule.displayName(),
                rule.description(),
                rule.triggerEventClass().getSimpleName(),
                rule.parameters(),
                ativo,
                activation != null ? activation.getConfig() : null,
                activation != null && activation.getActivatedBy() != null
                        ? activation.getActivatedBy().getId() : null,
                activation != null ? activation.getActivatedAt() : null,
                activation != null ? activation.getDeactivatedAt() : null
        );
    }
}
