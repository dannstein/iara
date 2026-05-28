package br.com.iara.iara_api.dto.servico;

import br.com.iara.iara_api.domain.SolicitacaoHistorico;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SolicitacaoHistoricoDTO(
        UUID id,
        String statusPara,
        String observacao,
        UUID responsavelId,
        OffsetDateTime createdAt
) {
    public static SolicitacaoHistoricoDTO from(SolicitacaoHistorico h) {
        return new SolicitacaoHistoricoDTO(
                h.getId(),
                h.getStatusPara(),
                h.getObservacao(),
                h.getResponsavel() != null ? h.getResponsavel().getId() : null,
                h.getCreatedAt()
        );
    }
}
