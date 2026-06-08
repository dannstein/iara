package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.WorkerEventoDisponibilidade;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkerDisponibilidadeDTO(
        UUID id,
        UUID pcEventoId,
        UUID pcId,
        UUID eventoId,
        UUID usuarioId,
        String usuarioNome,
        String status,
        UUID idMotivoRecusa,
        String motivoCodigo,
        String motivoLabel,
        String motivoDescricao,
        OffsetDateTime dataSolicitacao,
        OffsetDateTime dataResposta
) {
    public static WorkerDisponibilidadeDTO from(WorkerEventoDisponibilidade d) {
        var motivo = d.getMotivoRecusa();
        return new WorkerDisponibilidadeDTO(
                d.getId(),
                d.getPcEvento().getId(),
                d.getPcEvento().getPc().getId(),
                d.getPcEvento().getEvento().getId(),
                d.getUsuario().getId(),
                d.getUsuario().getNome(),
                d.getStatus(),
                motivo != null ? motivo.getId() : null,
                motivo != null ? motivo.getCodigo() : null,
                motivo != null ? motivo.getLabel() : null,
                d.getMotivoDescricao(),
                d.getDataSolicitacao(),
                d.getDataResposta()
        );
    }
}
