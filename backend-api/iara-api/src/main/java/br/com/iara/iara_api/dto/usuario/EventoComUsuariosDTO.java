package br.com.iara.iara_api.dto.usuario;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.List;
import java.util.UUID;

public record EventoComUsuariosDTO(
        UUID eventoId,
        String eventoTitulo,
        String severidade,
        String status,
        int raioMetros,
        CoordenadasDTO coordenadas,
        int totalUsuarios,
        List<UsuarioLocalizacaoDTO> usuarios
) {
    public static EventoComUsuariosDTO from(Evento e, List<UsuarioLocalizacaoDTO> usuarios) {
        return new EventoComUsuariosDTO(
                e.getId(),
                e.getTitulo(),
                e.getSeveridade(),
                e.getStatus(),
                e.getRaioMetros(),
                GeoUtil.toCoordenadas(e.getCoordenadas()),
                usuarios.size(),
                usuarios
        );
    }
}
