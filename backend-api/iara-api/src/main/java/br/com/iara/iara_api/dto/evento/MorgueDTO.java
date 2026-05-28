package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Morgue;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MorgueDTO(
        UUID id,
        String codigoMorgue,
        UUID idTriagem,
        String nomeIdentificado,
        String documento,
        Short idadeEstimada,
        String sexo,
        CoordenadasDTO localEncontrado,
        String descricaoLocal,
        String localRemocao,
        OffsetDateTime dataRemocao,
        OffsetDateTime createdAt
) {
    public static MorgueDTO from(Morgue m) {
        return new MorgueDTO(
                m.getId(),
                m.getCodigoMorgue(),
                m.getTriagem() != null ? m.getTriagem().getId() : null,
                m.getNomeIdentificado(),
                m.getDocumento(),
                m.getIdadeEstimada(),
                m.getSexo(),
                GeoUtil.toCoordenadas(m.getLocalEncontrado()),
                m.getDescricaoLocal(),
                m.getLocalRemocao(),
                m.getDataRemocao(),
                m.getCreatedAt()
        );
    }
}
