package br.com.iara.iara_api.service.automatico.rules;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.dto.alerta.AlertaDTO;
import br.com.iara.iara_api.dto.alerta.CreateEventZoneAlertRequest;
import br.com.iara.iara_api.repository.EventoRepository;
import br.com.iara.iara_api.service.AlertaService;
import br.com.iara.iara_api.service.alert.EventoAprovadoEvent;
import br.com.iara.iara_api.service.automatico.IAlertaAutomaticoRule;
import br.com.iara.iara_api.service.automatico.RuleParameter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Quando um evento é aprovado, notifica os usuários presentes no raio do evento
 * (EVENT_ZONE com modos INSIDE+NEAR) sobre a situação.
 */
@Component
@RequiredArgsConstructor
public class EventoAprovadoNotificarProximosRule implements IAlertaAutomaticoRule {

    private final AlertaService alertaService;
    private final EventoRepository eventoRepository;

    @Override
    public String id() {
        return "EVENTO_APROVADO_NOTIFICAR_PROXIMOS";
    }

    @Override
    public String displayName() {
        return "Notificar usuários próximos quando evento for aprovado";
    }

    @Override
    public String description() {
        return "Cria automaticamente um alerta EVENT_ZONE para todos os usuários "
                + "no raio do evento sempre que um gestor aprovar um novo evento.";
    }

    @Override
    public Class<?> triggerEventClass() {
        return EventoAprovadoEvent.class;
    }

    @Override
    public List<RuleParameter> parameters() {
        return List.of(
                RuleParameter.enumParam("severidade", "Severidade do alerta", "WARNING",
                        "INFO", "WARNING", "DANGER", "EMERGENCY"),
                RuleParameter.bool("requerAck", "Exigir confirmação dos destinatários", false)
        );
    }

    @Override
    public AlertaDTO apply(Object event, Map<String, Object> config, UUID tenantId) {
        EventoAprovadoEvent e = (EventoAprovadoEvent) event;
        Evento evento = eventoRepository.findById(e.eventoId()).orElse(null);
        if (evento == null) return null;

        String severidade = strParam(config, "severidade", "WARNING");
        boolean requerAck = boolParam(config, "requerAck", false);

        CreateEventZoneAlertRequest req = new CreateEventZoneAlertRequest(
                e.eventoId(),
                false,
                severidade,
                null,
                null,
                List.of("INSIDE", "NEAR"),
                null,
                null,
                null,
                requerAck,
                null, null, null
        );
        return alertaService.criarEventZone(req);
    }

    static String strParam(Map<String, Object> cfg, String k, String def) {
        if (cfg == null) return def;
        Object v = cfg.get(k);
        return v != null ? v.toString() : def;
    }

    static boolean boolParam(Map<String, Object> cfg, String k, boolean def) {
        if (cfg == null) return def;
        Object v = cfg.get(k);
        return v instanceof Boolean b ? b : def;
    }

    static Integer intParam(Map<String, Object> cfg, String k, Integer def) {
        if (cfg == null) return def;
        Object v = cfg.get(k);
        return v instanceof Number n ? n.intValue() : def;
    }
}
