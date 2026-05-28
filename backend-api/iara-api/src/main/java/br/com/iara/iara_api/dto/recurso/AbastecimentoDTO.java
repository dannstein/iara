package br.com.iara.iara_api.dto.recurso;

import br.com.iara.iara_api.domain.LocalAbastecimento;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record AbastecimentoDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String tipo,
        CoordenadasDTO coordenadas,
        String descricaoItens,
        String contato,
        boolean isActive
) {
    public static AbastecimentoDTO from(LocalAbastecimento l) {
        return new AbastecimentoDTO(
                l.getId(), l.getTenant().getId(), l.getNome(), l.getTipo(),
                GeoUtil.toCoordenadas(l.getCoordenadas()), l.getDescricaoItens(), l.getContato(), l.isActive()
        );
    }
}
