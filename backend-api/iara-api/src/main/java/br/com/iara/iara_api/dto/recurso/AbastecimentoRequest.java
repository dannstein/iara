package br.com.iara.iara_api.dto.recurso;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AbastecimentoRequest(
        @NotBlank @Size(max = 200) String nome,
        @NotBlank String tipo,
        @NotNull @Valid CoordenadasDTO coordenadas,
        String descricaoItens,
        @Size(max = 100) String contato
) {
}
