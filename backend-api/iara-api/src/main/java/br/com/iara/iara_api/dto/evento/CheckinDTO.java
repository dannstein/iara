package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Checkin;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CheckinDTO(
        UUID id,
        UUID eventoId,
        UUID usuarioId,
        CoordenadasDTO coordenadas,
        OffsetDateTime dataCheckin,
        OffsetDateTime dataCheckout
) {
    public static CheckinDTO from(Checkin c) {
        return new CheckinDTO(
                c.getId(),
                c.getEvento().getId(),
                c.getUsuario().getId(),
                GeoUtil.toCoordenadas(c.getCoordenadas()),
                c.getDataCheckin(),
                c.getDataCheckout()
        );
    }
}
