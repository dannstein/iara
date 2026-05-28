package br.com.iara.iara_api.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Criação de conta gerenciada por GESTOR/ADMIN. O perfil é definido por quem cria,
 * limitado ao próprio nível (sem escalonamento) e ao escopo de tenant.
 */
public record CriarUsuarioGerenciadoRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Email @Size(max = 254) String email,
        @Size(max = 20) String telefone,
        @NotBlank @Size(max = 14) String documento,
        @NotBlank @Size(min = 8, max = 100) String senha,
        @NotNull UUID tenantId,
        @NotBlank String roleNome
) {
}
