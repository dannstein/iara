package br.com.iara.iara_api.dto.usuario;

import jakarta.validation.constraints.NotBlank;

public record RejeitarCadastroRequest(
        @NotBlank String motivo
) {
}
