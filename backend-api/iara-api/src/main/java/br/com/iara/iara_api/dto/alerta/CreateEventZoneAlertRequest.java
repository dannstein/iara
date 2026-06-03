package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CreateEventZoneAlertRequest(
        UUID idEvento,
        boolean todosEventos,
        @NotNull String severidade,
        String titulo,
        String mensagem,
        @NotEmpty List<String> geofenceModes,
        Integer raioMetros,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes,
        boolean requerAck,
        // Fase 2C — modos históricos de geofence
        Integer lastHours,
        Integer frequentMinDays,
        Integer frequentLastDays
) {
}
