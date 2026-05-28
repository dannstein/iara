package br.com.iara.iara_api.dto.usuario;

import br.com.iara.iara_api.domain.ZonaRisco;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ZonaComUsuariosDTO(
        UUID zonaId,
        String zonaNome,
        String zonaTipo,
        short nivelRisco,
        int totalUsuarios,
        Map<String, Object> geometria,
        List<UsuarioLocalizacaoDTO> usuarios
) {
    public static ZonaComUsuariosDTO from(ZonaRisco z, List<UsuarioLocalizacaoDTO> usuarios) {
        return new ZonaComUsuariosDTO(
                z.getId(),
                z.getNome(),
                z.getTipo(),
                z.getNivelRisco(),
                usuarios.size(),
                z.getGeometria() != null ? GeoUtil.toGeoJson(z.getGeometria()) : null,
                usuarios
        );
    }
}
