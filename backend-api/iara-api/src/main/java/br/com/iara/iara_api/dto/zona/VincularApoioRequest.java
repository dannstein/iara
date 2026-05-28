package br.com.iara.iara_api.dto.zona;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record VincularApoioRequest(
        @NotNull UUID idPontoApoio
) {
}
