package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record SetorRequest(
        @NotBlank String tipo,
        @NotNull Map<String, Object> geometria,
        String descricao
) {
}
