package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record CreateEventoRequest(
        @NotBlank @Size(max = 200) String titulo,
        String descricao,
        @NotNull UUID idTipo,
        @NotBlank String severidade,
        @NotNull @Valid CoordenadasDTO coordenadas,
        @Positive Integer raioMetros,
        Map<String, Object> areaRisco,
        @Size(max = 13) String cobradeCod,
        Boolean isSimulado
) {
}
