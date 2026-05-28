package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.EventoHistorico;

import java.time.OffsetDateTime;
import java.util.UUID;

public record HistoricoDTO(
        UUID id,
        String statusDe,
        String statusPara,
        UUID responsavelId,
        String observacao,
        OffsetDateTime createdAt
) {
    public static HistoricoDTO from(EventoHistorico h) {
        return new HistoricoDTO(
                h.getId(),
                h.getStatusDe(),
                h.getStatusPara(),
                h.getResponsavel().getId(),
                h.getObservacao(),
                h.getCreatedAt()
        );
    }
}
