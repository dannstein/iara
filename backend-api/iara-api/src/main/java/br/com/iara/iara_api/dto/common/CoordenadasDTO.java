package br.com.iara.iara_api.dto.common;

import jakarta.validation.constraints.NotNull;

/**
 * Par lat/lng usado em toda a API. Convertido para JTS Point (SRID 4326) via GeoUtil.
 */
public record CoordenadasDTO(
        @NotNull Double lat,
        @NotNull Double lng
) {
}
