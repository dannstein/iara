package br.com.iara.iara_api.dto.recurso;

import br.com.iara.iara_api.domain.RecursoDc;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.util.geo.GeoUtil;

import java.util.UUID;

public record RecursoDTO(
        UUID id,
        UUID tenantId,
        UUID idTipo,
        String tipoNome,
        String identificacao,
        String descricao,
        CoordenadasDTO localizacao,
        String status
) {
    public static RecursoDTO from(RecursoDc r) {
        return new RecursoDTO(
                r.getId(), r.getTenant().getId(), r.getTipo().getId(), r.getTipo().getTipoNome(),
                r.getIdentificacao(), r.getDescricao(), GeoUtil.toCoordenadas(r.getLocalizacao()), r.getStatus()
        );
    }
}
