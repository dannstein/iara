package br.com.iara.iara_api.dto.tenant;

import br.com.iara.iara_api.domain.Tenant;

import java.util.UUID;

public record TenantDTO(
        UUID id,
        String nome,
        String tipo,
        String uf,
        String ibgeCod,
        UUID idPai,
        boolean isActive
) {
    public static TenantDTO from(Tenant t) {
        return new TenantDTO(
                t.getId(), t.getNome(), t.getTipo(), t.getUf(), t.getIbgeCod(),
                t.getPai() != null ? t.getPai().getId() : null,
                t.isActive()
        );
    }
}
