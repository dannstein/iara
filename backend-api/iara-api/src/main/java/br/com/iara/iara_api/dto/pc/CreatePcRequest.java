package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreatePcRequest(
        @NotBlank @Size(max = 200) String pcNome,
        String pcTipo,
        @NotNull @Valid CoordenadasDTO coordenadas,
        String pcDesc,
        @Size(max = 100) String pcContato
) {
}
