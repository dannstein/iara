package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record MarcarRecebidaRequest(
        @NotNull @Positive Integer qtdRecebida
) {
}
