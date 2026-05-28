package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record TecnicoDisponivelDTO(
        UUID id,
        String nome,
        String telefone,
        UUID especId,
        String especNome,
        CoordenadasDTO localizacao
) {
    public static TecnicoDisponivelDTO from(Usuario u) {
        return new TecnicoDisponivelDTO(
                u.getId(),
                u.getNome(),
                u.getTelefone(),
                u.getEspec() != null ? u.getEspec().getId() : null,
                u.getEspec() != null ? u.getEspec().getEspecNome() : null,
                GeoUtil.toCoordenadas(u.getLocalizacao())
        );
    }
}
