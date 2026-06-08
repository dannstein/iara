package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcDemanda;

import java.time.OffsetDateTime;
import java.util.UUID;

public record DemandaDTO(
        UUID id,
        UUID pcId,
        UUID eventoId,
        UUID idTipo,
        String tipoNome,
        String prioridade,
        int qtdSolicitada,
        int qtdAtendida,
        String descricao,
        boolean isActive,
        // ---- Fase 4C: lifecycle status + tracking
        String status,
        int qtdRecebida,
        int qtdIntencionada,
        Integer qtdMaximaCapacidade,
        OffsetDateTime dataFechamento,
        UUID idUsuFechou
) {
    public static DemandaDTO from(PcDemanda d) {
        return new DemandaDTO(
                d.getId(),
                d.getPc().getId(),
                d.getEvento().getId(),
                d.getTipo().getId(),
                d.getTipo().getDNome(),
                d.getPrioridade(),
                d.getQtdSolicitada(),
                d.getQtdAtendida(),
                d.getDescricao(),
                d.isActive(),
                d.getStatus(),
                d.getQtdRecebida(),
                d.getQtdIntencionada(),
                d.getQtdMaximaCapacidade(),
                d.getDataFechamento(),
                d.getFechadoPor() != null ? d.getFechadoPor().getId() : null
        );
    }
}
