package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcCapacidade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CapacidadeDTO(
        UUID pcId,
        UUID idTipo,
        String tipoNome,
        int qtdMaxima,
        UUID alteradoPor,
        OffsetDateTime updatedAt
) {
    public static CapacidadeDTO from(PcCapacidade c) {
        return new CapacidadeDTO(
                c.getPc().getId(),
                c.getTipo().getId(),
                c.getTipo().getDNome(),
                c.getQtdMaxima(),
                c.getAlteradoPor() != null ? c.getAlteradoPor().getId() : null,
                c.getUpdatedAt()
        );
    }
}
