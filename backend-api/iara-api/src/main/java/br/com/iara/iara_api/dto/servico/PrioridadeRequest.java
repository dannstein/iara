package br.com.iara.iara_api.dto.servico;

import jakarta.validation.constraints.NotBlank;

public record PrioridadeRequest(@NotBlank String prioridade) {
}
