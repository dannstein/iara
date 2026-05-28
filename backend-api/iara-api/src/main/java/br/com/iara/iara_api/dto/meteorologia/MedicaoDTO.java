package br.com.iara.iara_api.dto.meteorologia;

import br.com.iara.iara_api.domain.Medicao;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MedicaoDTO(
        UUID id,
        UUID estacaoId,
        OffsetDateTime dataMedicao,
        BigDecimal chuvaMm,
        BigDecimal nivelRioM,
        BigDecimal temperaturaC,
        BigDecimal umidadePct
) {
    public static MedicaoDTO from(Medicao m) {
        return new MedicaoDTO(m.getId(), m.getEstacao().getId(), m.getDataMedicao(),
                m.getChuvaMm(), m.getNivelRioM(), m.getTemperaturaC(), m.getUmidadePct());
    }
}
