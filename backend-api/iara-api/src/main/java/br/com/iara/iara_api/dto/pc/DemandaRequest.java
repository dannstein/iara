package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record DemandaRequest(
        @NotNull UUID idEvento,
        @NotNull UUID idTipo,
        String prioridade,
        @NotNull @Positive Integer qtdSolicitada,
        String descricao
) {
}
