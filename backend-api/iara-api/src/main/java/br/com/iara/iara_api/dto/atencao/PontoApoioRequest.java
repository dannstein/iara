package br.com.iara.iara_api.dto.atencao;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PontoApoioRequest(
        @NotBlank @Size(max = 200) String nome,
        String descricao,
        @Size(max = 500) String enderecoTxt,
        @Size(max = 100) String contato,
        @Size(max = 150) String responsavel
) {
}
