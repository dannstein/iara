package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record CheckinRequest(
        @NotNull @Valid CoordenadasDTO coordenadas,
        OffsetDateTime dataSincronizacao
) {
}
