package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.repository.AlertaDestinatarioRepository;
import br.com.iara.iara_api.repository.AlertaRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Roda a cada 60s. Para cada TECHNICAL_REQUEST ATIVO com configuração de expansão:
 *
 *  1) Conta aceites (response='ACCEPT' em iara_alerta_destinatario)
 *  2) Se aceites >= ack_minimo → meta atingida, faz nada
 *  3) Se last_expansion_at + window_minutes > now → ainda dentro da janela, aguarda
 *  4) Se há próximo passo de expansão (current_step < radii.length - 1):
 *     - Calcula novo raio
 *     - Identifica os técnicos novos no raio expandido (excluindo já-destinatários)
 *     - Cria linhas em iara_alerta_destinatario para os novos
 *     - Publica chunk em RabbitMQ via dispatcher
 *     - Atualiza current_expansion_step, raio_metros, last_expansion_at
 *     - Publica AlertaExpandedEvent
 *  5) Se já está no último passo: nada mais a fazer
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaRadiusExpansionJob {

    private final AlertaRepository alertaRepository;
    private final AlertaDestinatarioRepository destinatarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final AlertaDispatcher dispatcher;
    private final PlatformTransactionManager txManager;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT45S")
    public void runExpansion() {
        List<Alerta> candidates = new TransactionTemplate(txManager).execute(s ->
                alertaRepository.findExpansionCandidates());
        if (candidates == null || candidates.isEmpty()) return;

        log.debug("[AlertaRadiusExpansionJob] {} candidato(s) para análise", candidates.size());
        for (Alerta a : candidates) {
            processOne(a.getId());
        }
    }

    private void processOne(UUID alertaId) {
        TransactionTemplate tt = new TransactionTemplate(txManager);
        tt.executeWithoutResult(status -> {
            Alerta a = alertaRepository.findById(alertaId).orElse(null);
            if (a == null || !"ACTIVE".equals(a.getStatus())) return;

            // 1) Aceites já alcançados
            long aceites = destinatarioRepository.countByAlertaIdAndResponse(alertaId, "ACCEPT");
            Integer minimo = a.getAckMinimo();
            if (minimo == null || aceites >= minimo) return;

            // 2) Janela ainda aberta?
            OffsetDateTime now = OffsetDateTime.now();
            int windowMin = a.getExpansionWindowMinutes() != null ? a.getExpansionWindowMinutes() : 5;
            if (a.getLastExpansionAt() != null
                    && a.getLastExpansionAt().plusMinutes(windowMin).isAfter(now)) {
                return;
            }

            // 3) Próximo passo de expansão disponível?
            List<Integer> radii = parseRadii(a.getExpansionRadiiMetros());
            int nextStep = a.getCurrentExpansionStep() + 1;
            if (nextStep >= radii.size()) {
                log.info("[AlertaRadiusExpansionJob] Alerta {} esgotou passos de expansão (último={}m)",
                        alertaId, radii.get(radii.size() - 1));
                return;
            }
            int fromRadius = radii.get(a.getCurrentExpansionStep());
            int toRadius = radii.get(nextStep);

            // 4) Identifica novos destinatários
            if (a.getEvento() == null || a.getEvento().getCoordenadas() == null) {
                log.warn("[AlertaRadiusExpansionJob] Alerta {} sem evento/coordenadas — pula", alertaId);
                return;
            }
            double lat = a.getEvento().getCoordenadas().getY();
            double lng = a.getEvento().getCoordenadas().getX();
            List<Usuario> novos = usuarioRepository.tecnicosNovosNoRaio(
                    lat, lng, toRadius, null, alertaId.toString());

            if (novos.isEmpty()) {
                log.info("[AlertaRadiusExpansionJob] Expansão {}→{}m sem novos técnicos para alerta {}",
                        fromRadius, toRadius, alertaId);
                // Avança o passo mesmo assim — tentar próximo no próximo ciclo
                a.setCurrentExpansionStep(nextStep);
                a.setRaioMetros(toRadius);
                a.setLastExpansionAt(now);
                return;
            }

            // 5) Dispatch para novos (saveAll + RabbitMQ)
            Set<UUID> newIds = new HashSet<>();
            for (Usuario u : novos) newIds.add(u.getId());
            dispatcher.dispatchAdditional(a, newIds);

            a.setCurrentExpansionStep(nextStep);
            a.setRaioMetros(toRadius);
            a.setLastExpansionAt(now);

            log.info("[AlertaRadiusExpansionJob] Alerta {} expandido {}→{}m, +{} destinatários",
                    alertaId, fromRadius, toRadius, novos.size());
            applicationEventPublisher.publishEvent(
                    new AlertaExpandedEvent(alertaId, fromRadius, toRadius, novos.size(), nextStep));
        });
    }

    private static List<Integer> parseRadii(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Integer::parseInt).toList();
    }
}
