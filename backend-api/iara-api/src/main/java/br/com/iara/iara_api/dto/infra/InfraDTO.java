package br.com.iara.iara_api.dto.infra;

import br.com.iara.iara_api.domain.InfraMunicipal;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record InfraDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String tipo,
        CoordenadasDTO coordenadas,
        String contato24h,
        Integer capacidadeAtendimento,
        String responsavelNome,
        String responsavelContato,
        String descricao,
        boolean isActive
) {
    public static InfraDTO from(InfraMunicipal i) {
        return new InfraDTO(
                i.getId(), i.getTenant().getId(), i.getNome(), i.getTipo(),
                GeoUtil.toCoordenadas(i.getCoordenadas()), i.getContato24h(),
                i.getCapacidadeAtendimento(), i.getResponsavelNome(), i.getResponsavelContato(),
                i.getDescricao(), i.isActive()
        );
    }
}
