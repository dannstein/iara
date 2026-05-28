package br.com.iara.iara_api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record WebRegisterRequest(
        @NotBlank @Size(max = 150) String nome,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8) String senha,
        @NotBlank @Size(max = 14) String documento,
        String telefone,
        @NotNull UUID tenantId,
        @NotBlank String roleNome
) {}