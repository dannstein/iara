package br.com.iara.iara_api.dto.atencao;

import java.util.UUID;

/** XOR: enviar exatamente uma de (idPc, idAbrigo, idPontoApoio). */
public record ApoioVinculoRequest(
        UUID idPc,
        UUID idAbrigo,
        UUID idPontoApoio,
        String observacao
) {
}
