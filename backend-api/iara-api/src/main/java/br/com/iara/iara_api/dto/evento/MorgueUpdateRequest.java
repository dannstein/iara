package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record MorgueUpdateRequest(
        String nomeIdentificado,
        @Size(max = 14) String documento,
        String localRemocao,
        OffsetDateTime dataRemocao
) {
}
