package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record AvaliacaoRequest(
        @NotNull @Min(1) @Max(5) Short nota,
        String pontosPositivos,
        String pontosMelhoria
) {
}
