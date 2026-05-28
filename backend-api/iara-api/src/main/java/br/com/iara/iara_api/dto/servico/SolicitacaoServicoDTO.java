package br.com.iara.iara_api.dto.servico;

import br.com.iara.iara_api.domain.SolicitacaoServico;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record SolicitacaoServicoDTO(
        UUID id,
        UUID usuarioId,
        UUID tenantId,
        String tipo,
        String enderecoTxt,
        CoordenadasDTO geometria,
        String descricaoMotivo,
        List<Map<String, Object>> fotosUrls,
        String status,
        String prioridade,
        UUID responsavelId,
        String observacaoDc,
        List<String> pdfUrls,
        OffsetDateTime createdAt
) {
    public static SolicitacaoServicoDTO from(SolicitacaoServico s, List<String> pdfUrls) {
        return new SolicitacaoServicoDTO(
                s.getId(), s.getUsuario().getId(), s.getTenant().getId(), s.getTipo(),
                s.getEnderecoTxt(), GeoUtil.toCoordenadas(s.getGeometria()), s.getDescricaoMotivo(),
                s.getFotosUrls(), s.getStatus(), s.getPrioridade(),
                s.getResponsavel() != null ? s.getResponsavel().getId() : null,
                s.getObservacaoDc(), pdfUrls, s.getCreatedAt()
        );
    }
}
