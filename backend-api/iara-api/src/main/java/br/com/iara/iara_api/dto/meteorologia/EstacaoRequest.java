package br.com.iara.iara_api.dto.meteorologia;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EstacaoRequest(
        @NotBlank @Size(max = 200) String nome,
        @NotBlank String fonte,
        @Size(max = 50) String codigoExterno,
        @NotNull @Valid CoordenadasDTO coordenadas,
        @NotBlank String tipo
) {
}
