package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.PositiveOrZero;

public record IncidentesRequest(
        @PositiveOrZero Integer mortos,
        @PositiveOrZero Integer feridos,
        @PositiveOrZero Integer desabrigados,
        @PositiveOrZero Integer desaparecidos,
        @PositiveOrZero Integer startVermelho,
        @PositiveOrZero Integer startAmarelo,
        @PositiveOrZero Integer startVerde,
        @PositiveOrZero Integer startPreto
) {
}
