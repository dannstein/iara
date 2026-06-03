package br.com.iara.iara_api.dto.alerta;

import br.com.iara.iara_api.domain.AlertaAutomaticoLog;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record AlertaAutomaticoLogDTO(
        UUID id,
        String ruleId,
        String acao,
        UUID usuarioId,
        UUID alertaId,
        Map<String, Object> payload,
        OffsetDateTime createdAt
) {
    public static AlertaAutomaticoLogDTO from(AlertaAutomaticoLog l) {
        return new AlertaAutomaticoLogDTO(
                l.getId(),
                l.getRuleId(),
                l.getAcao(),
                l.getUsuario() != null ? l.getUsuario().getId() : null,
                l.getAlertaId(),
                l.getPayload(),
                l.getCreatedAt()
        );
    }
}
