package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.EventoEspecNecessaria;

import java.util.UUID;

public record EspecNecessariaDTO(
        UUID id,
        UUID idEspec,
        String especNome,
        int qtdNecessaria,
        int qtdAlocada
) {
    public static EspecNecessariaDTO from(EventoEspecNecessaria e) {
        return new EspecNecessariaDTO(
                e.getId(),
                e.getEspec().getId(),
                e.getEspec().getEspecNome(),
                e.getQtdNecessaria(),
                e.getQtdAlocada()
        );
    }
}
