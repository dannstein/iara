package br.com.iara.iara_api.dto.tenant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateTenantRequest(
        @NotBlank @Size(max = 200) String nome,
        @NotBlank String tipo,
        @Size(max = 2) String uf,
        @Size(max = 7) String ibgeCod,
        @NotNull UUID idPai
) {
}
