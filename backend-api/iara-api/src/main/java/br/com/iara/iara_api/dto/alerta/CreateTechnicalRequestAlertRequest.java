package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateTechnicalRequestAlertRequest(
        @NotNull UUID idEvento,
        UUID especialidadeId,
        Integer raioMetros,
        boolean tenantWide,
        String titulo,
        String mensagem,
        Integer ackMinimo,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes
) {
}
