package br.com.iara.iara_api.service.automatico.rules;

import br.com.iara.iara_api.dto.alerta.AlertaDTO;
import br.com.iara.iara_api.dto.alerta.CreateTechnicalRequestAlertRequest;
import br.com.iara.iara_api.service.AlertaService;
import br.com.iara.iara_api.service.alert.EventoAprovadoEvent;
import br.com.iara.iara_api.service.automatico.IAlertaAutomaticoRule;
import br.com.iara.iara_api.service.automatico.RuleParameter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static br.com.iara.iara_api.service.automatico.rules.EventoAprovadoNotificarProximosRule.boolParam;
import static br.com.iara.iara_api.service.automatico.rules.EventoAprovadoNotificarProximosRule.intParam;

/**
 * Quando um evento é aprovado, convoca automaticamente técnicos disponíveis para
 * atender (TECHNICAL_REQUEST). Configuração permite definir ackMinimo, raio etc.
 */
@Component
@RequiredArgsConstructor
public class EventoAprovadoConvocarTecnicosRule implements IAlertaAutomaticoRule {

    private final AlertaService alertaService;

    @Override
    public String id() {
        return "EVENTO_APROVADO_CONVOCAR_TECNICOS";
    }

    @Override
    public String displayName() {
        return "Convocar técnicos automaticamente quando evento for aprovado";
    }

    @Override
    public String description() {
        return "Cria um TECHNICAL_REQUEST para os técnicos disponíveis no raio do "
                + "evento (ou todos do tenant, se configurado), pedindo confirmação.";
    }

    @Override
    public Class<?> triggerEventClass() {
        return EventoAprovadoEvent.class;
    }

    @Override
    public List<RuleParameter> parameters() {
        return List.of(
                RuleParameter.bool("tenantWide", "Convocar todos os técnicos do tenant (ignora raio)", false),
                RuleParameter.number("ackMinimo", "Mínimo de aceites", 3)
        );
    }

    @Override
    public AlertaDTO apply(Object event, Map<String, Object> config, UUID tenantId) {
        EventoAprovadoEvent e = (EventoAprovadoEvent) event;
        boolean tenantWide = boolParam(config, "tenantWide", false);
        Integer ackMinimo = intParam(config, "ackMinimo", 3);

        CreateTechnicalRequestAlertRequest req = new CreateTechnicalRequestAlertRequest(
                e.eventoId(),
                null,         // qualquer especialidade
                null,
                tenantWide,
                null,
                null,
                ackMinimo,
                null,
                null,
                null,
                null
        );
        return alertaService.criarTechnicalRequest(req);
    }
}
