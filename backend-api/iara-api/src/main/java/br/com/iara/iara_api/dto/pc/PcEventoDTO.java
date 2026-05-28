package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcEvento;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PcEventoDTO(
        UUID id,
        UUID pcId,
        UUID eventoId,
        String status,
        OffsetDateTime dataNotificacao,
        OffsetDateTime dataResposta
) {
    public static PcEventoDTO from(PcEvento pe) {
        return new PcEventoDTO(
                pe.getId(),
                pe.getPc().getId(),
                pe.getEvento().getId(),
                pe.getStatus(),
                pe.getDataNotificacao(),
                pe.getDataResposta()
        );
    }
}
