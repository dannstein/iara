package br.com.iara.iara_api.service.automatico.rules;

import br.com.iara.iara_api.dto.alerta.AlertaDTO;
import br.com.iara.iara_api.dto.alerta.CreateCollectionPointsAlertRequest;
import br.com.iara.iara_api.service.AlertaService;
import br.com.iara.iara_api.service.alert.EventoAprovadoEvent;
import br.com.iara.iara_api.service.automatico.IAlertaAutomaticoRule;
import br.com.iara.iara_api.service.automatico.RuleParameter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static br.com.iara.iara_api.service.automatico.rules.EventoAprovadoNotificarProximosRule.strParam;

/**
 * Quando um evento é aprovado, notifica os coordenadores dos pontos de coleta
 * próximos para que iniciem a logística de recebimento de doações.
 */
@Component
@RequiredArgsConstructor
public class EventoAprovadoAvisarPcsRule implements IAlertaAutomaticoRule {

    private final AlertaService alertaService;

    @Override
    public String id() {
        return "EVENTO_APROVADO_AVISAR_PCS";
    }

    @Override
    public String displayName() {
        return "Notificar Pontos de Coleta quando evento for aprovado";
    }

    @Override
    public String description() {
        return "Cria automaticamente um COLLECTION_POINTS para os coordenadores "
                + "de PCs próximos do evento, anunciando a abertura de chamada de doações.";
    }

    @Override
    public Class<?> triggerEventClass() {
        return EventoAprovadoEvent.class;
    }

    @Override
    public List<RuleParameter> parameters() {
        return List.of(
                RuleParameter.enumParam("escopoTipo", "Alcance",
                        "RAIO", "RAIO", "TENANT"),
                RuleParameter.enumParam("severidade", "Severidade", "INFO",
                        "INFO", "WARNING", "DANGER")
        );
    }

    @Override
    public AlertaDTO apply(Object event, Map<String, Object> config, UUID tenantId) {
        EventoAprovadoEvent e = (EventoAprovadoEvent) event;
        String escopoTipo = strParam(config, "escopoTipo", "RAIO");
        String severidade = strParam(config, "severidade", "INFO");

        CreateCollectionPointsAlertRequest req = new CreateCollectionPointsAlertRequest(
                e.eventoId(),
                escopoTipo,
                null,
                severidade,
                null,
                null,
                null,
                null
        );
        return alertaService.criarCollectionPoints(req);
    }
}
