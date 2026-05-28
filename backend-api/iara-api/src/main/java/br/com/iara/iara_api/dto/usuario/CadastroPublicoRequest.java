package br.com.iara.iara_api.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Cadastro público de DOADOR, USUARIO_SIMPLES ou COORDENADOR (aprovação automática).
 */
public record CadastroPublicoRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 20) String telefone,
        @NotBlank @Size(max = 14) String documento,
        @NotBlank @Size(min = 8, max = 100) String senha,
        @NotNull UUID tenantId
) {
}
