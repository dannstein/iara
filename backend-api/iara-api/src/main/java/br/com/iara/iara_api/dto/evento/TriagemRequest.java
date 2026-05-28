package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public record TriagemRequest(
        @NotBlank @Size(max = 20) String codigoCampo,
        @Size(max = 150) String nomeProvisorio,
        Short idadeEstimada,
        @NotBlank String classificacao,
        Boolean respiraAposAbertura,
        CoordenadasDTO coordenadas,
        UUID idSetor,
        OffsetDateTime dataSincronizacao
) {
}
