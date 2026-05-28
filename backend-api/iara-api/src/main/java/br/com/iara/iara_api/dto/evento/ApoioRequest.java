package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.NotBlank;

public record ApoioRequest(
        @NotBlank String descricao
) {
}
