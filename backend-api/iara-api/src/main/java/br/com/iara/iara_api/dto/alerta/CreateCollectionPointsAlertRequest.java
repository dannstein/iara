package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateCollectionPointsAlertRequest(
        @NotNull UUID idEvento,
        String escopoTipo,
        Integer raioMetros,
        @NotNull String severidade,
        String titulo,
        String mensagem,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes
) {
}
