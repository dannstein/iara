package br.com.iara.iara_api.dto.abrigo;

import br.com.iara.iara_api.domain.Abrigo;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record AbrigoDTO(
        UUID id,
        UUID tenantId,
        UUID eventoId,
        String nome,
        String descricao,
        CoordenadasDTO coordenadas,
        int capacidadeTotal,
        int ocupacaoAtual,
        String contato,
        boolean isActive
) {
    public static AbrigoDTO from(Abrigo a) {
        return new AbrigoDTO(
                a.getId(),
                a.getTenant().getId(),
                a.getEvento() != null ? a.getEvento().getId() : null,
                a.getNome(),
                a.getDescricao(),
                GeoUtil.toCoordenadas(a.getCoordenadas()),
                a.getCapacidadeTotal(),
                a.getOcupacaoAtual(),
                a.getContato(),
                a.isActive()
        );
    }
}
