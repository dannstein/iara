package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.Size;

public record UpdatePcRequest(
        @Size(max = 200) String pcNome,
        String pcDesc,
        @Size(max = 100) String pcContato
) {
}
