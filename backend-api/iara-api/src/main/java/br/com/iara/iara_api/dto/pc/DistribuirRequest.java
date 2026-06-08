package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record DistribuirRequest(
        @NotNull UUID idTipo,
        @NotNull @Positive Integer quantidade,
        @Size(max = 500) String observacao
) {
}
