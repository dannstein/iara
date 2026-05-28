package br.com.iara.iara_api.dto.hospital;

import br.com.iara.iara_api.domain.Hospital;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record HospitalDTO(
        UUID id,
        UUID tenantId,
        String nome,
        String cnes,
        String tipo,
        CoordenadasDTO coordenadas,
        String contato,
        Integer leitosTotal,
        Integer leitosDisponiveis,
        Integer leitosUti,
        Integer leitosUtiDisp,
        boolean aceitaCampanha,
        boolean isActive
) {
    public static HospitalDTO from(Hospital h) {
        return new HospitalDTO(
                h.getId(), h.getTenant().getId(), h.getNome(), h.getCnes(), h.getTipo(),
                GeoUtil.toCoordenadas(h.getCoordenadas()), h.getContato(),
                h.getLeitosTotal(), h.getLeitosDisponiveis(), h.getLeitosUti(), h.getLeitosUtiDisp(),
                h.isAceitaCampanha(), h.isActive()
        );
    }
}
