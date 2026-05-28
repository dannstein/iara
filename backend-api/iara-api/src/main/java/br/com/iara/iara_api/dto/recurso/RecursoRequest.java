package br.com.iara.iara_api.dto.recurso;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RecursoRequest(
        @NotNull UUID idTipo,
        @NotBlank @Size(max = 100) String identificacao,
        @Size(max = 255) String descricao,
        CoordenadasDTO localizacao,
        String status
) {
}
