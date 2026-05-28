package br.com.iara.iara_api.dto.evento;

import br.com.iara.iara_api.domain.Evento;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FideDTO(
        String cobradeCod,
        String municipioAfetado,
        String decretoMunicipal,
        LocalDate dataDecreto,
        Integer popAfetada,
        String danosMateriais,
        String acoesResposta,
        String recursosSolicitados,
        BigDecimal prejuizoPublico,
        BigDecimal prejuizoPrivado,
        String danosHumanosDesc,
        String fideStatus
) {
    public static FideDTO from(Evento e) {
        return new FideDTO(
                e.getCobradeCod(),
                e.getFideMunicipioAfetado(),
                e.getFideDecretoMunicipal(),
                e.getFideDataDecreto(),
                e.getFidePopAfetada(),
                e.getFideDanosMateriais(),
                e.getFideAcoesResposta(),
                e.getFideRecursosSolicitados(),
                e.getFidePrejuizoPublico(),
                e.getFidePrejuizoPrivado(),
                e.getFideDanosHumanosDesc(),
                e.getFideStatus()
        );
    }
}
