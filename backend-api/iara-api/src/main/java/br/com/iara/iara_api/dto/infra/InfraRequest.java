package br.com.iara.iara_api.dto.infra;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InfraRequest(
        @NotBlank @Size(max = 200) String nome,
        @NotBlank String tipo,
        @NotNull @Valid CoordenadasDTO coordenadas,
        @NotBlank @Size(max = 100) String contato24h,
        Integer capacidadeAtendimento,
        @Size(max = 150) String responsavelNome,
        @Size(max = 20) String responsavelContato,
        String descricao
) {
}
