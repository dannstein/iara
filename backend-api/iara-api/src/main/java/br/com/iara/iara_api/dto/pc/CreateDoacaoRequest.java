package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateDoacaoRequest(
        @NotNull UUID idPc,
        @NotNull UUID idDemanda,
        @NotNull UUID idTipo,
        @NotNull @Positive Integer quantidade,
        String descricao,
        OffsetDateTime dataPrevista
) {
}
