package br.com.iara.iara_api.dto.recurso;

import br.com.iara.iara_api.domain.RecursoDcEvento;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RecursoEventoDTO(
        UUID id,
        UUID recursoId,
        UUID eventoId,
        String condutorNome,
        String condutorContato,
        String condutorHabilitacao,
        String responsavelNome,
        OffsetDateTime dataAlocacao,
        OffsetDateTime dataLiberacao,
        String observacao
) {
    public static RecursoEventoDTO from(RecursoDcEvento r) {
        return new RecursoEventoDTO(
                r.getId(), r.getRecurso().getId(), r.getEvento().getId(),
                r.getCondutorNome(), r.getCondutorContato(), r.getCondutorHabilitacao(),
                r.getResponsavelNome(), r.getDataAlocacao(), r.getDataLiberacao(), r.getObservacao()
        );
    }
}
