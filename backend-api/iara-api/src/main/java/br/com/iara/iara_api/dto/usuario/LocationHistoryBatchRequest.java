package br.com.iara.iara_api.dto.usuario;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Batch de pontos de localização enviados pelo app móvel.
 * Limite de 100 pontos por requisição para proteger o banco; a app deve
 * agrupar e enviar a cada minuto ou ao voltar ao foreground.
 */
public record LocationHistoryBatchRequest(
        @NotEmpty @Size(max = 100) List<Point> pontos
) {
    public record Point(
            @NotNull Double lat,
            @NotNull Double lng,
            @NotNull OffsetDateTime capturedAt
    ) {
    }
}
