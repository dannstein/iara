package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Body do {@code PATCH /pontos-coleta/{pcId}/eventos/{eventoId}/recusar} (sub-fase 4B).
 * O coordenador deve indicar um motivo do catálogo {@link MotivoRecusaDTO}. Se o motivo
 * for marcado como {@code exigeDescricao}, {@link #descricao} é obrigatório.
 */
public record RecusarPcEventoRequest(
        @NotNull UUID idMotivoRecusa,
        @Size(max = 500) String descricao
) {
}
