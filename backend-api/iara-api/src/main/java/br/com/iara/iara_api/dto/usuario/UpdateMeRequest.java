package br.com.iara.iara_api.dto.usuario;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.constraints.Size;

public record UpdateMeRequest(
        @Size(max = 150) String nome,
        @Size(max = 20) String telefone,
        @Size(max = 500) String fotoUrl,
        EnderecoInput endereco,
        CoordenadasDTO localizacao
) {
    public record EnderecoInput(
            @Size(max = 9) String cep,
            @Size(max = 255) String logradouro,
            @Size(max = 10) String numero,
            @Size(max = 100) String complemento,
            @Size(max = 100) String bairro,
            @Size(max = 100) String cidade,
            @Size(max = 2) String uf,
            CoordenadasDTO coordenadas
    ) {
    }
}
