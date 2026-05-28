package br.com.iara.iara_api.dto.zona;

import br.com.iara.iara_api.domain.ZonaRisco;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;
import org.locationtech.jts.geom.Point;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ZonaRiscoDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String descricao,
        String tipo,
        Map<String, Object> geometria,
        CoordenadasDTO coordenadas,
        Integer raioMetros,
        short nivelRisco,
        String fonte,
        LocalDate dataMapeamento,
        List<ApoioRef> apoios,
        String situacaoApoio,
        boolean isActive
) {
    public record ApoioRef(UUID id, String nome) {
    }

    public static ZonaRiscoDTO from(ZonaRisco z) {
        List<ApoioRef> apoios = z.getApoios().stream()
                .filter(br.com.iara.iara_api.domain.PontoApoioGeral::isActive)
                .map(a -> new ApoioRef(a.getId(), a.getNome()))
                .toList();
        CoordenadasDTO coords = z.getGeometria() instanceof Point p ? GeoUtil.toCoordenadas(p) : null;
        return new ZonaRiscoDTO(
                z.getId(), z.getTenant().getId(), z.getNome(), z.getDescricao(), z.getTipo(),
                GeoUtil.toGeoJson(z.getGeometria()), coords, z.getRaioMetros(), z.getNivelRisco(),
                z.getFonte(), z.getDataMapeamento(), apoios,
                apoios.isEmpty() ? "SEM_APOIO" : "COM_APOIO", z.isActive()
        );
    }
}
