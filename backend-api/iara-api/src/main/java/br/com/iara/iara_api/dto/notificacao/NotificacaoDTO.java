package br.com.iara.iara_api.dto.notificacao;

import br.com.iara.iara_api.domain.Notificacao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificacaoDTO(
        UUID id,
        String titulo,
        String mensagem,
        String tipo,
        UUID idRef,
        boolean lida,
        OffsetDateTime createdAt
) {
    public static NotificacaoDTO from(Notificacao n) {
        return new NotificacaoDTO(n.getId(), n.getTitulo(), n.getMensagem(), n.getTipo(),
                n.getIdRef(), n.isLida(), n.getCreatedAt());
    }
}
