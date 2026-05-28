package br.com.iara.iara_api.dto.recurso;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AlocarRecursoRequest(
        @NotNull UUID idRecurso,
        String condutorNome,
        String condutorContato,
        String condutorHabilitacao,
        String responsavelNome,
        String responsavelContato,
        String observacao
) {
}
