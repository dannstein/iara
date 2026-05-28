package br.com.iara.iara_api.dto.abrigo;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record AbrigoRequest(
        @NotBlank @Size(max = 200) String nome,
        String descricao,
        @NotNull @Valid CoordenadasDTO coordenadas,
        @NotNull @Positive Integer capacidadeTotal,
        @Size(max = 100) String contato,
        UUID idEvento
) {
}
