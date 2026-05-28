package br.com.iara.iara_api.dto.usuario;

import jakarta.validation.constraints.NotBlank;

public record MudarRoleRequest(
        @NotBlank String roleNome
) {
}
