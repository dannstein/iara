package br.com.iara.iara_api.dto.alerta;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CreatePersonalizedAlertRequest(
        @NotNull String severidade,
        String targetRole,
        CoordenadasDTO coordenadas,
        Integer raioMetros,
        List<String> geofenceModes,
        UUID idEvento,
        UUID idZonaRisco,
        UUID idTenantAlvo,
        @NotBlank String titulo,
        @NotBlank String mensagem,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes,
        boolean requerAck,
        // Fase 2C — modos históricos de geofence
        Integer lastHours,
        Integer frequentMinDays,
        Integer frequentLastDays
) {
}
