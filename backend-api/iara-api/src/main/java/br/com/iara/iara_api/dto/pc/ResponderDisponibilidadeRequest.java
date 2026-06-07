package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Body do {@code PATCH /worker/evento-disponibilidade/{id}/recusar} (sub-fase 4B).
 * Para confirmar usa-se o endpoint {@code /confirmar} sem body.
 */
public record ResponderDisponibilidadeRequest(
        UUID idMotivoRecusa,
        @Size(max = 500) String descricao
) {
}
