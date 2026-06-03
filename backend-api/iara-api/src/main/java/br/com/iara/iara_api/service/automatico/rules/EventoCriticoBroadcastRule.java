package br.com.iara.iara_api.service.automatico.rules;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.dto.alerta.AlertaDTO;
import br.com.iara.iara_api.dto.alerta.CreateTenantBroadcastRequest;
import br.com.iara.iara_api.repository.EventoRepository;
import br.com.iara.iara_api.service.AlertaService;
import br.com.iara.iara_api.service.alert.EventoStatusChangedEvent;
import br.com.iara.iara_api.service.automatico.IAlertaAutomaticoRule;
import br.com.iara.iara_api.service.automatico.RuleParameter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Quando um evento muda para ALERTA_CRITICO, dispara um broadcast EMERGENCY
 * para todos os usuários do tenant.
 */
@Component
@RequiredArgsConstructor
public class EventoCriticoBroadcastRule implements IAlertaAutomaticoRule {

    private final AlertaService alertaService;
    private final EventoRepository eventoRepository;

    @Override
    public String id() {
        return "EVENTO_ALERTA_CRITICO_BROADCAST";
    }

    @Override
    public String displayName() {
        return "Broadcast EMERGENCY quando evento entra em ALERTA_CRITICO";
    }

    @Override
    public String description() {
        return "Dispara um TENANT_BROADCAST com severidade EMERGENCY toda vez que "
                + "um evento muda de status para ALERTA_CRITICO. Apenas para o tenant "
                + "dono do evento.";
    }

    @Override
    public Class<?> triggerEventClass() {
        return EventoStatusChangedEvent.class;
    }

    @Override
    public List<RuleParameter> parameters() {
        return List.of();
    }

    @Override
    public AlertaDTO apply(Object event, Map<String, Object> config, UUID tenantId) {
        EventoStatusChangedEvent e = (EventoStatusChangedEvent) event;
        // Esta regra só age na transição para ALERTA_CRITICO.
        if (!"ALERTA_CRITICO".equals(e.statusNovo())) return null;

        Evento evento = eventoRepository.findById(e.eventoId()).orElse(null);
        if (evento == null) return null;

        String mensagem = "Evento em situação CRÍTICA: " + evento.getTitulo()
                + ". Permaneça atento às orientações da Defesa Civil.";

        CreateTenantBroadcastRequest req = new CreateTenantBroadcastRequest(
                tenantId,
                null,             // todos os roles
                "EMERGENCY",
                "ALERTA CRÍTICO",
                mensagem,
                null,
                null
        );
        return alertaService.criarTenantBroadcast(req);
    }
}
