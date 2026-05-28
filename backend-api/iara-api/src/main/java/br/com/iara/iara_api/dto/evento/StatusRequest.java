package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.NotBlank;

public record StatusRequest(
        @NotBlank String status,
        String observacao
) {
}
