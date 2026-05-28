package br.com.iara.iara_api.dto.hospital;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HospitalRequest(
        @NotBlank @Size(max = 200) String nome,
        @Size(max = 7) String cnes,
        @NotBlank String tipo,
        @NotNull @Valid CoordenadasDTO coordenadas,
        @Size(max = 100) String contato,
        Integer leitosTotal,
        Integer leitosDisponiveis,
        Integer leitosUti,
        Integer leitosUtiDisp,
        Boolean aceitaCampanha
) {
}
