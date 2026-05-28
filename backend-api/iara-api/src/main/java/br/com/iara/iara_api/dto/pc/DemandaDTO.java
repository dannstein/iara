package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcDemanda;

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
        boolean isActive
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
                d.isActive()
        );
    }
}
