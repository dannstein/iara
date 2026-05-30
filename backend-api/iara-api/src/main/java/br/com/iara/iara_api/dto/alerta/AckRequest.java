package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotNull;

public record AckRequest(
        @NotNull String acao
) {
}
