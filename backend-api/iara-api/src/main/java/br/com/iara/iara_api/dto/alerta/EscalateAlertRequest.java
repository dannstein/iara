package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EscalateAlertRequest(
        @NotNull UUID idTenantAlvo,
        @NotNull String severidade,
        @NotBlank @Size(min = 20, message = "Motivo de escalonamento deve ter no mínimo 20 caracteres")
        String motivo,
        @NotBlank String titulo,
        @NotBlank String mensagem,
        UUID idEvento,
        UUID idZonaRisco,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes
) {
}
