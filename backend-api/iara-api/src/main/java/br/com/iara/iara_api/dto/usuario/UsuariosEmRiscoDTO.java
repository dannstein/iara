package br.com.iara.iara_api.dto.usuario;

import java.util.List;

public record UsuariosEmRiscoDTO(
        int totalUsuariosEmRisco,
        List<ZonaComUsuariosDTO> zonas,
        List<EventoComUsuariosDTO> eventos
) {
}
