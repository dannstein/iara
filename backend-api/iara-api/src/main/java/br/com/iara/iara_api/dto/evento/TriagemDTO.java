package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.VitimaTriagem;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TriagemDTO(
        UUID id,
        String codigoCampo,
        String nomeProvisorio,
        Short idadeEstimada,
        String classificacao,
        Boolean respiraAposAbertura,
        CoordenadasDTO localEncontrado,
        UUID setorId,
        UUID triadorId,
        OffsetDateTime createdAt
) {
    public static TriagemDTO from(VitimaTriagem t) {
        return new TriagemDTO(
                t.getId(),
                t.getCodigoCampo(),
                t.getNomeProvisorio(),
                t.getIdadeEstimada(),
                t.getClassificacao(),
                t.getRespiraAposAbertura(),
                GeoUtil.toCoordenadas(t.getLocalEncontrado()),
                t.getSetor() != null ? t.getSetor().getId() : null,
                t.getTriador().getId(),
                t.getCreatedAt()
        );
    }
}
