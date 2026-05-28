package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.SetorOperacao;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.Map;
import java.util.UUID;

public record SetorDTO(
        UUID id,
        String tipo,
        Map<String, Object> geometria,
        String descricao
) {
    public static SetorDTO from(SetorOperacao s) {
        return new SetorDTO(s.getId(), s.getTipo(), GeoUtil.toGeoJson(s.getGeometria()), s.getDescricao());
    }
}
