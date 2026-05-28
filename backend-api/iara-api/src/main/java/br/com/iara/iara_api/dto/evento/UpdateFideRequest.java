package br.com.iara.iara_api.dto.evento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateFideRequest(
        String municipioAfetado,
        String decretoMunicipal,
        LocalDate dataDecreto,
        Integer popAfetada,
        String danosMateriais,
        String acoesResposta,
        String recursosSolicitados,
        BigDecimal prejuizoPublico,
        BigDecimal prejuizoPrivado,
        String danosHumanosDesc
) {
}
