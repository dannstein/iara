package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcEstoque;

import java.util.UUID;

public record EstoqueDTO(
        UUID id,
        UUID idTipo,
        String tipoNome,
        int quantidade
) {
    public static EstoqueDTO from(PcEstoque e) {
        return new EstoqueDTO(e.getId(), e.getTipo().getId(), e.getTipo().getDNome(), e.getQuantidade());
    }
}
