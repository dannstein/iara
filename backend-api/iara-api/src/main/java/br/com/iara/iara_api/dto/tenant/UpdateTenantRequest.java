package br.com.iara.iara_api.dto.tenant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateTenantRequest(
        @NotBlank @Size(max = 200) String nome,
        @Size(max = 2) String uf,
        @Size(max = 7) String ibgeCod,
        Boolean isActive
) {
}
