package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.Pc;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record PcDTO(
        UUID id,
        UUID tenantId,
        UUID coordenadorId,
        UUID enderecoId,
        String pcNome,
        String pcTipo,
        CoordenadasDTO coordenadas,
        String pcDesc,
        String pcContato,
        boolean pcIsVerified,
        boolean isActive,
        String statusVerificacao,
        String motivoRejeicao
) {
    public static PcDTO from(Pc p) {
        return new PcDTO(
                p.getId(),
                p.getTenant().getId(),
                p.getCoordenador().getId(),
                p.getEndereco() != null ? p.getEndereco().getId() : null,
                p.getPcNome(),
                p.getPcTipo(),
                GeoUtil.toCoordenadas(p.getPcCoords()),
                p.getPcDesc(),
                p.getPcContato(),
                p.isPcIsVerified(),
                p.isActive(),
                p.getStatusVerificacao(),
                p.getMotivoRejeicao()
        );
    }
}
