package br.com.iara.iara_api.dto.atencao;

import br.com.iara.iara_api.domain.PontoAtencao;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record PontoAtencaoDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String descricao,
        String enderecoTxt,
        CoordenadasDTO geometria,
        boolean isIndustrial,
        String substanciaPerigosaTxt,
        String classeRiscoIndustrial,
        short nivelRisco,
        Integer populacaoEstimada,
        String situacaoApoio,
        boolean isActive
) {
    public static PontoAtencaoDTO from(PontoAtencao p) {
        return new PontoAtencaoDTO(
                p.getId(), p.getTenant().getId(), p.getNome(), p.getDescricao(), p.getEnderecoTxt(),
                GeoUtil.toCoordenadas(p.getGeometria()), p.isIndustrial(), p.getSubstanciaPerigosaTxt(),
                p.getClasseRiscoIndustrial(), p.getNivelRisco(), p.getPopulacaoEstimada(),
                p.getSituacaoApoio(), p.isActive()
        );
    }
}
