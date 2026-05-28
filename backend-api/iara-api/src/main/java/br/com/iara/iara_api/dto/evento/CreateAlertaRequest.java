package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record CreateAlertaRequest(
        UUID idEvento,
        @NotNull UUID idTipo,
        @NotBlank String mensagem,
        Map<String, Object> areaAlerta
) {
}
