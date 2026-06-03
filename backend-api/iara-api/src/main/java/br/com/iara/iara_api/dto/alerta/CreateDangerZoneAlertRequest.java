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
        boolean requerAck,
        // Fase 2C — modos históricos de geofence
        Integer lastHours,            // PASSED_THROUGH: olhar últimas N horas (default 24)
        Integer frequentMinDays,      // FREQUENT: pelo menos N dias distintos com presença
        Integer frequentLastDays      // FREQUENT: dentro dos últimos N dias (default 30)
) {
}
