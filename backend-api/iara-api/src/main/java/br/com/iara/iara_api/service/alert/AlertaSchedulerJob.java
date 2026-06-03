package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.AlertaAgendado;
import br.com.iara.iara_api.dto.alerta.*;
import br.com.iara.iara_api.repository.AlertaAgendadoRepository;
import br.com.iara.iara_api.service.AlertaService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Roda a cada 30s e dispara os agendamentos cujo {@code proxima_execucao <= now()}.
 *
 * <p>Cada disparo:
 *  - Desserializa o payload para o request DTO da categoria;
 *  - Autentica temporariamente como o criador do agendamento (SecurityContextHolder);
 *  - Invoca o método correto de {@link AlertaService};
 *  - Recalcula {@code proxima_execucao} via {@link RecurrenceCalculator};
 *  - Em caso de erro: persiste {@code ultimo_erro}, mas mantém ativo (retry no próximo tick).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaSchedulerJob {

    private final AlertaAgendadoRepository repository;
    private final AlertaService alertaService;
    private final PlatformTransactionManager txManager;

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Scheduled(fixedDelayString = "PT30S", initialDelayString = "PT15S")
    public void runScheduler() {
        OffsetDateTime now = OffsetDateTime.now();
        List<AlertaAgendado> due = new TransactionTemplate(txManager).execute(s ->
                repository.findDueForExecution(now));
        if (due == null || due.isEmpty()) return;

        log.info("[AlertaSchedulerJob] {} agendamento(s) prontos para disparo", due.size());
        for (AlertaAgendado a : due) {
            executeOne(a.getId());
        }
    }

    private void executeOne(java.util.UUID agendamentoId) {
        TransactionTemplate tt = new TransactionTemplate(txManager);
        tt.executeWithoutResult(status -> {
            AlertaAgendado a = repository.findById(agendamentoId).orElse(null);
            if (a == null || !a.isAtivo()) return;
            OffsetDateTime executedAt = OffsetDateTime.now();
            try {
                authenticateAs(a.getCriador().getEmail(), a.getCriador().getRole().getRoleNome());
                dispatchByCategoria(a);
                a.setUltimaExecucao(executedAt);
                a.setTotalDisparos(a.getTotalDisparos() + 1);
                a.setUltimoErro(null);
                OffsetDateTime next = RecurrenceCalculator.computeNextExecution(a, executedAt);
                if (next == null) {
                    a.setAtivo(false);
                } else {
                    a.setProximaExecucao(next);
                }
            } catch (Exception e) {
                log.error("[AlertaSchedulerJob] falha disparando agendamento {}: {}", a.getId(), e.getMessage());
                a.setUltimoErro(e.getMessage());
                // Avança a próxima execução para evitar loop tight em erros persistentes
                OffsetDateTime next = RecurrenceCalculator.computeNextExecution(a, executedAt);
                if (next == null) {
                    a.setAtivo(false);
                } else {
                    a.setProximaExecucao(next);
                }
            } finally {
                clearAuthentication();
            }
        });
    }

    private void dispatchByCategoria(AlertaAgendado a) {
        Object payload = a.getPayload();
        switch (a.getCategoria()) {
            case "DANGER_ZONE" -> alertaService.criarDangerZone(
                    OBJECT_MAPPER.convertValue(payload, CreateDangerZoneAlertRequest.class));
            case "EVENT_ZONE" -> alertaService.criarEventZone(
                    OBJECT_MAPPER.convertValue(payload, CreateEventZoneAlertRequest.class));
            case "TENANT_BROADCAST" -> alertaService.criarTenantBroadcast(
                    OBJECT_MAPPER.convertValue(payload, CreateTenantBroadcastRequest.class));
            case "TECHNICAL_REQUEST" -> alertaService.criarTechnicalRequest(
                    OBJECT_MAPPER.convertValue(payload, CreateTechnicalRequestAlertRequest.class));
            case "SUPPORT_POINTS" -> alertaService.criarSupportPoints(
                    OBJECT_MAPPER.convertValue(payload, CreateSupportPointsAlertRequest.class));
            case "COLLECTION_POINTS" -> alertaService.criarCollectionPoints(
                    OBJECT_MAPPER.convertValue(payload, CreateCollectionPointsAlertRequest.class));
            case "MONITORS" -> alertaService.criarMonitors(
                    OBJECT_MAPPER.convertValue(payload, CreateMonitorsAlertRequest.class));
            case "PERSONALIZED" -> alertaService.criarPersonalized(
                    OBJECT_MAPPER.convertValue(payload, CreatePersonalizedAlertRequest.class));
            default -> throw new IllegalArgumentException("Categoria não suportada: " + a.getCategoria());
        }
    }

    private void authenticateAs(String email, String role) {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                email, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }
}
