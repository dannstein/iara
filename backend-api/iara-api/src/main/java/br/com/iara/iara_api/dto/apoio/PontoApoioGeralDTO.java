package br.com.iara.iara_api.dto.apoio;

import br.com.iara.iara_api.domain.PontoApoioGeral;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record PontoApoioGeralDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String descricao,
        CoordenadasDTO coordenadas,
        String contato,
        String responsavel,
        String enderecoTxt,
        UUID zonaRiscoId,
        String zonaRiscoNome,
        boolean isActive
) {
    public static PontoApoioGeralDTO from(PontoApoioGeral p) {
        return new PontoApoioGeralDTO(
                p.getId(),
                p.getTenant().getId(),
                p.getNome(),
                p.getDescricao(),
                GeoUtil.toCoordenadas(p.getGeometria()),
                p.getContato(),
                p.getResponsavel(),
                p.getEnderecoTxt(),
                p.getZonaRisco() != null ? p.getZonaRisco().getId() : null,
                p.getZonaRisco() != null ? p.getZonaRisco().getNome() : null,
                p.isActive()
        );
    }
}
