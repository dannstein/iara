package br.com.iara.iara_api.dto.pc;

import jakarta.validation.constraints.Size;

/**
 * Request opcional do PATCH /pontos-coleta/{id}/verificar (sub-fase 4A).
 *
 * <p>Quando body é omitido, o gestor está aprovando o PC (status=VERIFICADO).
 * Quando {@code rejeitar=true}, o PC vai para REJEITADO e {@code motivo} torna-se obrigatório.</p>
 */
public record VerificarPcRequest(
        Boolean rejeitar,
        @Size(max = 500) String motivo
) {
}
