package br.com.iara.iara_api.dto.usuario;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record UsuarioLocalizacaoDTO(
        UUID id,
        String nome,
        String role,
        String telefone,
        CoordenadasDTO localizacao
) {
    public static UsuarioLocalizacaoDTO from(Usuario u) {
        return new UsuarioLocalizacaoDTO(
                u.getId(),
                u.getNome(),
                u.getRole().getRoleNome(),
                u.getTelefone(),
                GeoUtil.toCoordenadas(u.getLocalizacao())
        );
    }
}
