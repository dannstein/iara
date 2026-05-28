package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record EspecNecessariaRequest(
        @NotNull UUID idEspec,
        @NotNull @Positive Integer qtdNecessaria
) {
}
