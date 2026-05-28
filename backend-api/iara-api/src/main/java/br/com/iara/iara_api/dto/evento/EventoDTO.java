package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record EventoDTO(
        UUID id,
        UUID tenantId,
        String titulo,
        String descricao,
        UUID idTipo,
        String tipoNome,
        String status,
        String severidade,
        UUID solicitanteId,
        UUID aprovadorId,
        CoordenadasDTO coordenadas,
        int raioMetros,
        Map<String, Object> areaRisco,
        boolean isSimulado,
        String cobradeCod,
        String fideStatus,
        long upvotes,
        OffsetDateTime dataSolicitacao,
        OffsetDateTime dataAprovacao
) {
    public static EventoDTO from(Evento e, long upvotes) {
        return new EventoDTO(
                e.getId(),
                e.getTenant().getId(),
                e.getTitulo(),
                e.getDescricao(),
                e.getTipo().getId(),
                e.getTipo().getDesastreNome(),
                e.getStatus(),
                e.getSeveridade(),
                e.getSolicitante().getId(),
                e.getAprovador() != null ? e.getAprovador().getId() : null,
                GeoUtil.toCoordenadas(e.getCoordenadas()),
                e.getRaioMetros(),
                GeoUtil.toGeoJson(e.getAreaRisco()),
                e.isSimulado(),
                e.getCobradeCod(),
                e.getFideStatus(),
                upvotes,
                e.getDataSolicitacao(),
                e.getDataAprovacao()
        );
    }
}
