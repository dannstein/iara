package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcAuditLog;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record PcAuditLogDTO(
        UUID id,
        UUID pcId,
        UUID eventoId,
        UUID atorId,
        String acao,
        Map<String, Object> payload,
        OffsetDateTime createdAt
) {
    public static PcAuditLogDTO from(PcAuditLog l) {
        return new PcAuditLogDTO(
                l.getId(),
                l.getPcId(),
                l.getEventoId(),
                l.getAtorId(),
                l.getAcao(),
                l.getPayload(),
                l.getCreatedAt()
        );
    }
}
