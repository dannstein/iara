package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateTenantBroadcastRequest(
        @NotNull UUID idTenantAlvo,
        String targetRole,
        @NotNull String severidade,
        String titulo,
        @NotBlank String mensagem,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes
) {
}
