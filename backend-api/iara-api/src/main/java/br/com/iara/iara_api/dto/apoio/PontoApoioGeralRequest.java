package br.com.iara.iara_api.dto.apoio;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PontoApoioGeralRequest(
        @NotBlank String nome,
        String descricao,
        @NotNull @Valid CoordenadasDTO coordenadas,
        String contato,
        String responsavel,
        String enderecoTxt
) {
}
