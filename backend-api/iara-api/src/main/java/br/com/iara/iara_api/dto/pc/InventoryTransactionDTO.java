package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.InventoryTransaction;

import java.time.OffsetDateTime;
import java.util.UUID;

public record InventoryTransactionDTO(
        UUID id,
        UUID pcId,
        UUID eventoId,
        UUID idTipo,
        String operacao,
        int quantidade,
        UUID usuarioId,
        UUID intencaoId,
        UUID demandaId,
        String observacao,
        OffsetDateTime createdAt
) {
    public static InventoryTransactionDTO from(InventoryTransaction t) {
        return new InventoryTransactionDTO(
                t.getId(),
                t.getPcId(),
                t.getEventoId(),
                t.getTipoId(),
                t.getOperacao(),
                t.getQuantidade(),
                t.getUsuarioId(),
                t.getIntencaoId(),
                t.getDemandaId(),
                t.getObservacao(),
                t.getCreatedAt()
        );
    }
}
