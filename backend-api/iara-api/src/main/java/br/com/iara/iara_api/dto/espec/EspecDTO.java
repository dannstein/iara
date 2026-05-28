package br.com.iara.iara_api.dto.espec;

import br.com.iara.iara_api.domain.Espec;

import java.util.UUID;

public record EspecDTO(UUID id, UUID idCategoria, String nome, String descricao, UUID idTenant) {

    public static EspecDTO from(Espec e) {
        return new EspecDTO(
                e.getId(),
                e.getCategoria().getId(),
                e.getEspecNome(),
                e.getEspecDesc(),
                e.getTenant() != null ? e.getTenant().getId() : null
        );
    }
}
