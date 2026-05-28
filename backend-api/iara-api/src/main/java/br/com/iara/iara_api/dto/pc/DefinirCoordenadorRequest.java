package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** Define o coordenador de um Ponto de Coleta (GESTOR/ADMIN). */
public record DefinirCoordenadorRequest(
        @NotNull UUID idUsuario
) {
}
