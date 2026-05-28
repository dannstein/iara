package br.com.iara.iara_api.dto.tenant;

import java.util.List;
import java.util.UUID;

public record TenantNodeDTO(
        UUID id,
        String nome,
        String tipo,
        String uf,
        List<TenantNodeDTO> filhos
) {
}
