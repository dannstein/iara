package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record AlertaDTO(
        UUID id,
        UUID idEvento,
        UUID idTipo,
        String tipoNome,
        String mensagem,
        Map<String, Object> areaAlerta,
        UUID emissorId,
        OffsetDateTime createdAt
) {
    public static AlertaDTO from(Alerta a) {
        return new AlertaDTO(
                a.getId(),
                a.getEvento() != null ? a.getEvento().getId() : null,
                a.getTipo().getId(),
                a.getTipo().getTipoNome(),
                a.getMensagem(),
                GeoUtil.toGeoJson(a.getAreaAlerta()),
                a.getEmissor().getId(),
                a.getCreatedAt()
        );
    }
}
