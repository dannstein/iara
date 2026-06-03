package br.com.iara.iara_api.service.automatico.rules;

import br.com.iara.iara_api.dto.alerta.AlertaDTO;
import br.com.iara.iara_api.dto.alerta.CreateDangerZoneAlertRequest;
import br.com.iara.iara_api.service.AlertaService;
import br.com.iara.iara_api.service.alert.ZonaRiscoCriadaEvent;
import br.com.iara.iara_api.service.automatico.IAlertaAutomaticoRule;
import br.com.iara.iara_api.service.automatico.RuleParameter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static br.com.iara.iara_api.service.automatico.rules.EventoAprovadoNotificarProximosRule.boolParam;
import static br.com.iara.iara_api.service.automatico.rules.EventoAprovadoNotificarProximosRule.strParam;

/**
 * Quando uma zona de risco é cadastrada, notifica usuários presentes na zona
 * (e/ou nas proximidades) com um DANGER_ZONE automático.
 */
@Component
@RequiredArgsConstructor
public class ZonaRiscoCriadaNotificarProximosRule implements IAlertaAutomaticoRule {

    private final AlertaService alertaService;

    @Override
    public String id() {
        return "ZONA_RISCO_CRIADA_NOTIFICAR_PROXIMOS";
    }

    @Override
    public String displayName() {
        return "Notificar usuários próximos quando zona de risco for criada";
    }

    @Override
    public String description() {
        return "Cria um DANGER_ZONE automático para os usuários dentro/próximos "
                + "da nova zona, alertando sobre o risco recém-cadastrado.";
    }

    @Override
    public Class<?> triggerEventClass() {
        return ZonaRiscoCriadaEvent.class;
    }

    @Override
    public List<RuleParameter> parameters() {
        return List.of(
                RuleParameter.enumParam("severidade", "Severidade", "WARNING",
                        "INFO", "WARNING", "DANGER", "EMERGENCY"),
                RuleParameter.bool("incluirEnderecoResidencial",
                        "Incluir usuários cujo endereço residencial está na zona", true)
        );
    }

    @Override
    public AlertaDTO apply(Object event, Map<String, Object> config, UUID tenantId) {
        ZonaRiscoCriadaEvent e = (ZonaRiscoCriadaEvent) event;
        String severidade = strParam(config, "severidade", "WARNING");
        boolean incluirHome = boolParam(config, "incluirEnderecoResidencial", true);

        List<String> modes = incluirHome
                ? List.of("INSIDE", "NEAR", "HOME")
                : List.of("INSIDE", "NEAR");

        CreateDangerZoneAlertRequest req = new CreateDangerZoneAlertRequest(
                e.zonaId(),
                false,
                severidade,
                null,
                null,
                modes,
                null,
                null,
                null,
                false,
                null, null, null
        );
        return alertaService.criarDangerZone(req);
    }
}
