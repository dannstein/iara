package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AjustarEstoqueRequest(
        @NotNull UUID idTipo,
        /** Positivo (entrada manual) ou negativo (saída sem registro de doação). */
        @NotNull Integer delta,
        @Size(max = 500) String observacao
) {
}
