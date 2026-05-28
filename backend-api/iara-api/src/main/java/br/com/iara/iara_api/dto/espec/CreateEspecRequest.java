package br.com.iara.iara_api.dto.espec;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateEspecRequest(
        @NotNull UUID idCategoria,
        @NotBlank @Size(max = 100) String nome,
        @Size(max = 255) String descricao
) {
}
