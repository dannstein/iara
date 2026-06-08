package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.DoacaoIntencao;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DoacaoDTO(
        UUID id,
        UUID usuarioId,
        UUID pcId,
        UUID demandaId,
        UUID idTipo,
        int quantidade,
        String descricao,
        String status,
        String pdrReferencia,
        OffsetDateTime dataPrevista,
        OffsetDateTime dataConfirmacao,
        // ----- Fase 4D -----
        int qtdRecebida,
        OffsetDateTime dataExpiracao
) {
    public static DoacaoDTO from(DoacaoIntencao d) {
        return new DoacaoDTO(
                d.getId(),
                d.getUsuario().getId(),
                d.getPc().getId(),
                d.getDemanda().getId(),
                d.getTipo().getId(),
                d.getQuantidade(),
                d.getDescricao(),
                d.getStatus(),
                d.getPdrReferencia(),
                d.getDataPrevista(),
                d.getDataConfirmacao(),
                d.getQtdRecebida(),
                d.getDataExpiracao()
        );
    }
}
