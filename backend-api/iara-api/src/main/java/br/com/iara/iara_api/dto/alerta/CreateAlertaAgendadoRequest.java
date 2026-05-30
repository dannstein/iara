package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Map;

/**
 * Cria um agendamento. {@code payload} é o body normal da criação da categoria
 * (ex.: CreateDangerZoneAlertRequest). Validado ao disparar.
 */
public record CreateAlertaAgendadoRequest(
        @NotBlank String nome,
        @NotNull String categoria,
        @NotNull Map<String, Object> payload,
        @NotNull String tipoRecorrencia,
        @NotNull OffsetDateTime inicio,
        OffsetDateTime fim,
        LocalTime horario,
        Integer diaSemana,
        Integer diaMes,
        Integer intervaloHoras
) {
}
