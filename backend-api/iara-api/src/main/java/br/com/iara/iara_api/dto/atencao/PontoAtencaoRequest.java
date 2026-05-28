package br.com.iara.iara_api.dto.atencao;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PontoAtencaoRequest(
        @NotBlank @Size(max = 200) String nome,
        String descricao,
        @NotBlank @Size(max = 500) String enderecoTxt,
        boolean isIndustrial,
        String substanciaPerigosaTxt,
        @Size(max = 100) String classeRiscoIndustrial,
        @Min(1) @Max(5) Short nivelRisco,
        Integer populacaoEstimada
) {
}
