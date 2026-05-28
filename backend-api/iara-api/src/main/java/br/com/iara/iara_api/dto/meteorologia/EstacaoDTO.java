package br.com.iara.iara_api.dto.meteorologia;

import br.com.iara.iara_api.domain.EstacaoMonitoramento;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record EstacaoDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String fonte,
        String codigoExterno,
        CoordenadasDTO coordenadas,
        String tipo,
        boolean isActive
) {
    public static EstacaoDTO from(EstacaoMonitoramento e) {
        return new EstacaoDTO(e.getId(), e.getTenant().getId(), e.getNome(), e.getFonte(),
                e.getCodigoExterno(), GeoUtil.toCoordenadas(e.getCoordenadas()), e.getTipo(), e.isActive());
    }
}
