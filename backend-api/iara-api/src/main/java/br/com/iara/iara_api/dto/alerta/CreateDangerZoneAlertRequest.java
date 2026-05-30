package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CreateDangerZoneAlertRequest(
        UUID idZonaRisco,
        boolean todasZonas,
        @NotNull String severidade,
        String titulo,
        String mensagem,
        @NotEmpty List<String> geofenceModes,
        Integer raioMetros,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes,
        boolean requerAck
) {
}
