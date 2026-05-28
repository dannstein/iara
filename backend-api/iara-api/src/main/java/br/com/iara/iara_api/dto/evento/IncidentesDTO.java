package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Incidentes;

import java.time.OffsetDateTime;
import java.util.UUID;

public record IncidentesDTO(
        UUID id,
        int mortos,
        int feridos,
        int desabrigados,
        int desaparecidos,
        int startVermelho,
        int startAmarelo,
        int startVerde,
        int startPreto,
        OffsetDateTime createdAt
) {
    public static IncidentesDTO from(Incidentes i) {
        return new IncidentesDTO(
                i.getId(), i.getMortos(), i.getFeridos(), i.getDesabrigados(), i.getDesaparecidos(),
                i.getStartVermelho(), i.getStartAmarelo(), i.getStartVerde(), i.getStartPreto(),
                i.getCreatedAt()
        );
    }
}
