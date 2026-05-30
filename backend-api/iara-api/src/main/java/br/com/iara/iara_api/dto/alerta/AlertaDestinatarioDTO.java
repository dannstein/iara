package br.com.iara.iara_api.dto.alerta;

import br.com.iara.iara_api.domain.AlertaDestinatario;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AlertaDestinatarioDTO(
        UUID id,
        UUID alertaId,
        UUID usuarioId,
        String usuarioNome,
        String usuarioRole,
        String deliveryStatus,
        String response,
        OffsetDateTime sentAt,
        OffsetDateTime deliveredAt,
        OffsetDateTime visualizedAt,
        OffsetDateTime acknowledgedAt,
        OffsetDateTime respondedAt,
        String failureReason
) {
    public static AlertaDestinatarioDTO from(AlertaDestinatario d) {
        return new AlertaDestinatarioDTO(
                d.getId(),
                d.getAlerta().getId(),
                d.getUsuario().getId(),
                d.getUsuario().getNome(),
                d.getUsuario().getRole().getRoleNome(),
                d.getDeliveryStatus(),
                d.getResponse(),
                d.getSentAt(),
                d.getDeliveredAt(),
                d.getVisualizedAt(),
                d.getAcknowledgedAt(),
                d.getRespondedAt(),
                d.getFailureReason()
        );
    }
}
