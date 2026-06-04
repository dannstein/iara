package br.com.iara.iara_api.service.automatico;

import br.com.iara.iara_api.domain.AlertaAutomatico;
import br.com.iara.iara_api.dto.alerta.AlertaDTO;
import br.com.iara.iara_api.repository.AlertaAutomaticoRepository;
import br.com.iara.iara_api.service.alert.EventoAprovadoEvent;
import br.com.iara.iara_api.service.alert.EventoStatusChangedEvent;
import br.com.iara.iara_api.service.alert.ZonaRiscoCriadaEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Roteador de eventos de domínio para as regras automáticas ativadas no tenant.
 *
 * Cada @TransactionalEventListener roda APÓS o commit da transação que publicou
 * o evento, evitando criar alertas para entidades que foram revertidas.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaAutomaticoListener {

    private final AlertaAutomaticoRegistry registry;
    private final AlertaAutomaticoRepository activationRepo;
    private final AlertaAutomaticoLogService logService;
    private final br.com.iara.iara_api.service.AppConfigService appConfigService;

    /**
     * Roda síncrono na mesma transação do publisher. Isso significa que a regra
     * pode contribuir DDL/DML para o tx do publisher; se algo a jusante rolar
     * back, os alertas automáticos rolam back junto (comportamento desejado:
     * não criar alertas para aprovações que falharam).
     */
    @EventListener
    public void onEventoAprovado(EventoAprovadoEvent e) {
        dispatch(EventoAprovadoEvent.class, e, e.tenantId());
    }

    @EventListener
    public void onEventoStatusChanged(EventoStatusChangedEvent e) {
        dispatch(EventoStatusChangedEvent.class, e, e.tenantId());
    }

    @EventListener
    public void onZonaRiscoCriada(ZonaRiscoCriadaEvent e) {
        dispatch(ZonaRiscoCriadaEvent.class, e, e.tenantId());
    }

    private void dispatch(Class<?> eventClass, Object event, UUID tenantId) {
        if (appConfigService.isDisasterMode()) {
            log.debug("[AlertaAutomaticoListener] disaster mode ativo — pulando {}", eventClass.getSimpleName());
            return;
        }
        List<IAlertaAutomaticoRule> applicable = registry.byTriggerClass(eventClass);
        if (applicable.isEmpty()) return;

        for (IAlertaAutomaticoRule rule : applicable) {
            AlertaAutomatico activation = activationRepo
                    .findByTenantIdAndRuleId(tenantId, rule.id())
                    .orElse(null);
            if (activation == null || !activation.isAtivo()) continue;

            try {
                AlertaDTO created = rule.apply(event, activation.getConfig(), tenantId);
                if (created != null) {
                    logService.logDisparo(tenantId, rule.id(), created.id(), event);
                    log.info("[AlertaAutomatico] regra={} tenant={} criou alerta={}",
                            rule.id(), tenantId, created.id());
                }
            } catch (Exception ex) {
                log.error("[AlertaAutomatico] regra={} falhou: {}", rule.id(), ex.getMessage(), ex);
                logService.logErro(tenantId, rule.id(), ex.getMessage());
            }
        }
    }
}
