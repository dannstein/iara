package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.InformeCampo;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.UUID;

public record InformeDTO(
        UUID id,
        UUID eventoId,
        UUID usuarioId,
        String descricao,
        CoordenadasDTO coordenadas,
        String anexoUrl,
        String canalEnvio,
        OffsetDateTime createdAt
) {
    public static InformeDTO from(InformeCampo i) {
        return new InformeDTO(
                i.getId(),
                i.getEvento().getId(),
                i.getUsuario().getId(),
                i.getDescricao(),
                GeoUtil.toCoordenadas(i.getCoordenadas()),
                i.getAnexoUrl(),
                i.getCanalEnvio(),
                i.getCreatedAt()
        );
    }
}
