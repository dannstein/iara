package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.AlertaAgendado;
import br.com.iara.iara_api.exception.BusinessException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;

/**
 * Calcula a próxima execução de um agendamento dado o estado atual.
 *
 * Tipos suportados:
 *   ONE_TIME — dispara uma vez em {@code inicio}, depois desativa
 *   HOURLY   — a cada {@code intervaloHoras} horas a partir de {@code inicio}
 *   DAILY    — todo dia no {@code horario}
 *   WEEKLY   — toda semana no {@code diaSemana} (0=domingo) + {@code horario}
 *   MONTHLY  — todo mês no {@code diaMes} + {@code horario}
 */
public final class RecurrenceCalculator {

    private RecurrenceCalculator() {}

    /**
     * Computa a primeira execução para um agendamento recém-criado.
     * O resultado nunca é anterior a {@code inicio}; para recorrentes, salta para a próxima
     * ocorrência futura se {@code inicio} já passou.
     */
    public static OffsetDateTime computeFirstExecution(AlertaAgendado a) {
        return computeNextFromBase(a, a.getInicio());
    }

    /**
     * Computa a próxima execução após uma execução que acabou de ocorrer em {@code lastExecutedAt}.
     * Retorna null se o agendamento esgotou (ONE_TIME, ou recorrente após {@code fim}).
     */
    public static OffsetDateTime computeNextExecution(AlertaAgendado a, OffsetDateTime lastExecutedAt) {
        String tipo = a.getTipoRecorrencia();
        if ("ONE_TIME".equals(tipo)) {
            return null;
        }
        OffsetDateTime next = computeNextFromBase(a, lastExecutedAt);
        if (a.getFim() != null && next != null && next.isAfter(a.getFim())) {
            return null;
        }
        return next;
    }

    private static OffsetDateTime computeNextFromBase(AlertaAgendado a, OffsetDateTime base) {
        String tipo = a.getTipoRecorrencia();
        OffsetDateTime now = OffsetDateTime.now();
        ZoneOffset offset = base.getOffset();

        return switch (tipo) {
            case "ONE_TIME" -> a.getInicio();
            case "HOURLY" -> {
                Integer interval = a.getIntervaloHoras();
                if (interval == null || interval <= 0) {
                    throw new BusinessException("HOURLY requer intervaloHoras > 0");
                }
                OffsetDateTime candidate = base.plusHours(interval);
                while (candidate.isBefore(now)) candidate = candidate.plusHours(interval);
                yield candidate;
            }
            case "DAILY" -> {
                LocalTime hora = requireHorario(a);
                LocalDate today = base.toLocalDate();
                OffsetDateTime candidate = OffsetDateTime.of(today, hora, offset);
                while (!candidate.isAfter(base) || candidate.isBefore(now)) {
                    candidate = candidate.plusDays(1);
                }
                yield candidate;
            }
            case "WEEKLY" -> {
                LocalTime hora = requireHorario(a);
                Integer dow = a.getDiaSemana();
                if (dow == null) throw new BusinessException("WEEKLY requer diaSemana");
                LocalDate today = base.toLocalDate();
                int targetDay = dow == 0 ? 7 : dow; // Java DOW: 1=monday..7=sunday; nosso 0=sunday
                OffsetDateTime candidate = OffsetDateTime.of(
                        today.with(TemporalAdjusters.nextOrSame(java.time.DayOfWeek.of(targetDay))),
                        hora, offset);
                while (!candidate.isAfter(base) || candidate.isBefore(now)) {
                    candidate = candidate.plusWeeks(1);
                }
                yield candidate;
            }
            case "MONTHLY" -> {
                LocalTime hora = requireHorario(a);
                Integer dom = a.getDiaMes();
                if (dom == null) throw new BusinessException("MONTHLY requer diaMes");
                LocalDate baseDate = base.toLocalDate();
                LocalDate candidateDate = baseDate.withDayOfMonth(Math.min(dom, baseDate.lengthOfMonth()));
                OffsetDateTime candidate = OffsetDateTime.of(candidateDate, hora, offset);
                while (!candidate.isAfter(base) || candidate.isBefore(now)) {
                    LocalDate nextMonth = candidate.toLocalDate().plusMonths(1);
                    candidate = OffsetDateTime.of(
                            nextMonth.withDayOfMonth(Math.min(dom, nextMonth.lengthOfMonth())),
                            hora, offset);
                }
                yield candidate;
            }
            default -> throw new BusinessException("Recorrência inválida: " + tipo);
        };
    }

    private static LocalTime requireHorario(AlertaAgendado a) {
        if (a.getHorario() == null) {
            throw new BusinessException(a.getTipoRecorrencia() + " requer horario");
        }
        return a.getHorario();
    }
}
