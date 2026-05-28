package br.com.iara.iara_api.dto.evento;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record UpdateEventoRequest(
        @Size(max = 200) String titulo,
        String descricao,
        String severidade,
        @Positive Integer raioMetros,
        Map<String, Object> areaRisco
) {
}
