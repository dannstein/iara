package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MorgueRequest(
        @NotBlank @Size(max = 20) String codigoMorgue,
        UUID idTriagem,
        String nomeIdentificado,
        @Size(max = 14) String documento,
        Short idadeEstimada,
        @Size(max = 1) String sexo,
        @NotNull @Valid CoordenadasDTO localEncontrado,
        String descricaoLocal,
        String localRemocao,
        OffsetDateTime dataSincronizacao
) {
}
