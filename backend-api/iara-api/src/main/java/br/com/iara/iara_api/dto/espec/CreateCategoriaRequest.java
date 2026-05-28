package br.com.iara.iara_api.dto.espec;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoriaRequest(
        @NotBlank @Size(max = 100) String nome,
        @Size(max = 255) String descricao
) {
}
