package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.SolicitacaoApoio;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ApoioDTO(
        UUID id,
        UUID eventoId,
        UUID origemId,
        String descricao,
        String status,
        UUID responsavelId,
        OffsetDateTime createdAt
) {
    public static ApoioDTO from(SolicitacaoApoio s) {
        return new ApoioDTO(
                s.getId(),
                s.getEvento().getId(),
                s.getOrigem().getId(),
                s.getDescricao(),
                s.getStatus(),
                s.getResponsavel() != null ? s.getResponsavel().getId() : null,
                s.getCreatedAt()
        );
    }
}
