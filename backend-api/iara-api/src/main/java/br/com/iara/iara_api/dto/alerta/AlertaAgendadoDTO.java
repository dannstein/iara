package br.com.iara.iara_api.dto.alerta;

import br.com.iara.iara_api.domain.AlertaAgendado;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record AlertaAgendadoDTO(
        UUID id,
        UUID tenantId,
        UUID criadorId,
        String nome,
        String categoria,
        Map<String, Object> payload,
        String tipoRecorrencia,
        OffsetDateTime inicio,
        OffsetDateTime fim,
        LocalTime horario,
        Integer diaSemana,
        Integer diaMes,
        Integer intervaloHoras,
        boolean isAtivo,
        OffsetDateTime ultimaExecucao,
        OffsetDateTime proximaExecucao,
        int totalDisparos,
        String ultimoErro,
        OffsetDateTime createdAt
) {
    public static AlertaAgendadoDTO from(AlertaAgendado a) {
        return new AlertaAgendadoDTO(
                a.getId(),
                a.getTenant().getId(),
                a.getCriador().getId(),
                a.getNome(),
                a.getCategoria(),
                a.getPayload(),
                a.getTipoRecorrencia(),
                a.getInicio(),
                a.getFim(),
                a.getHorario(),
                a.getDiaSemana(),
                a.getDiaMes(),
                a.getIntervaloHoras(),
                a.isAtivo(),
                a.getUltimaExecucao(),
                a.getProximaExecucao(),
                a.getTotalDisparos(),
                a.getUltimoErro(),
                a.getCreatedAt()
        );
    }
}
