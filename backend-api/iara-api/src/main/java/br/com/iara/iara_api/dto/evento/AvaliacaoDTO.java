package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.EventoAvaliacao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AvaliacaoDTO(
        UUID id,
        UUID usuarioId,
        Short nota,
        String pontosPositivos,
        String pontosMelhoria,
        OffsetDateTime createdAt
) {
    public static AvaliacaoDTO from(EventoAvaliacao a) {
        return new AvaliacaoDTO(
                a.getId(),
                a.getUsuario().getId(),
                a.getNota(),
                a.getPontosPositivos(),
                a.getPontosMelhoria(),
                a.getCreatedAt()
        );
    }
}
