package br.com.iara.iara_api.dto.usuario;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Resumo do atendimento de um voluntário em um evento (check-ins + triagens). */
public record AtendimentoDTO(
        UUID eventoId,
        String eventoTitulo,
        String severidade,
        int checkins,
        int triagens,
        OffsetDateTime primeiroCheckin,
        OffsetDateTime ultimoCheckout
) {
}
