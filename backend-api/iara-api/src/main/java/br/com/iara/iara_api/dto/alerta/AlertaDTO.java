package br.com.iara.iara_api.dto.alerta;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AlertaDTO(
        UUID id,
        UUID tenantId,
        UUID emissorId,
        UUID idEvento,
        UUID idZonaRisco,
        UUID idTipo,
        String tipoNome,
        String titulo,
        String mensagem,
        String severidade,
        String status,
        String categoria,
        String targetRole,
        CoordenadasDTO coordenadas,
        Integer raioMetros,
        Map<String, Object> areaAlerta,
        List<String> geofenceModes,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes,
        OffsetDateTime dataResolvido,
        UUID resolvedoPor,
        boolean requerAck,
        Integer ackMinimo,
        boolean isEscalation,
        String escalationMotivo,
        UUID escalationFromTenant,
        int totalDestinatarios,
        AckSummaryDTO ackSummary,
        int mergedCount,
        boolean merged,
        OffsetDateTime createdAt
) {
    public static AlertaDTO from(Alerta a, AckSummaryDTO ackSummary) {
        return from(a, ackSummary, false);
    }

    public static AlertaDTO from(Alerta a, AckSummaryDTO ackSummary, boolean merged) {
        return new AlertaDTO(
                a.getId(),
                a.getTenant().getId(),
                a.getEmissor().getId(),
                a.getEvento() != null ? a.getEvento().getId() : null,
                a.getZonaRisco() != null ? a.getZonaRisco().getId() : null,
                a.getTipo().getId(),
                a.getTipo().getTipoNome(),
                a.getTitulo(),
                a.getMensagem(),
                a.getSeveridade(),
                a.getStatus(),
                a.getCategoria(),
                a.getTargetRole(),
                GeoUtil.toCoordenadas(a.getCoordenadas()),
                a.getRaioMetros(),
                GeoUtil.toGeoJson(a.getAreaAlerta()),
                parseModes(a.getGeofenceModes()),
                a.getDataExpiracao(),
                a.getAutoExpireMinutes(),
                a.getDataResolvido(),
                a.getResolvedoPor() != null ? a.getResolvedoPor().getId() : null,
                a.isRequerAck(),
                a.getAckMinimo(),
                a.isEscalation(),
                a.getEscalationMotivo(),
                a.getEscalationFromTenant(),
                a.getTotalDestinatarios(),
                ackSummary,
                a.getMergedCount(),
                merged,
                a.getCreatedAt()
        );
    }

    public static AlertaDTO from(Alerta a) {
        return from(a, null);
    }

    private static List<String> parseModes(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
