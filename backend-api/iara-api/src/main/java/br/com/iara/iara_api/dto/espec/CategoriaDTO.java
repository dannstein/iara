package br.com.iara.iara_api.dto.espec;

import br.com.iara.iara_api.domain.EspecCategoria;

import java.util.List;
import java.util.UUID;

public record CategoriaDTO(
        UUID id,
        String nome,
        String descricao,
        UUID idTenant,
        List<EspecDTO> subcategorias
) {
    public static CategoriaDTO from(EspecCategoria c, List<EspecDTO> subcategorias) {
        return new CategoriaDTO(
                c.getId(),
                c.getCatNome(),
                c.getCatDesc(),
                c.getTenant() != null ? c.getTenant().getId() : null,
                subcategorias
        );
    }
}
