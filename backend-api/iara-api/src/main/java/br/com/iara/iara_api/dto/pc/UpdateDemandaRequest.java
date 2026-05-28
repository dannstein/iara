package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.Positive;

public record UpdateDemandaRequest(
        String prioridade,
        @Positive Integer qtdSolicitada,
        String descricao
) {
}
