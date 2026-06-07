package br.com.iara.iara_api.service.outbox;

import br.com.iara.iara_api.config.RabbitConfig;
import br.com.iara.iara_api.domain.OutboxEvent;
import br.com.iara.iara_api.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Sub-fase 4E — lê outbox PENDING e publica no RabbitMQ. Cada execução
 * pega até {@code BATCH} linhas com {@code FOR UPDATE SKIP LOCKED}, então
 * múltiplos pollers podem rodar em paralelo sem bloqueio. Em falha aplica
 * backoff exponencial via {@code next_attempt_at}.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class OutboxPollerJob {

    private static final int BATCH = 50;
    private static final int MAX_ATTEMPTS = 6;
    // Backoff por tentativa (segundos): 5, 30, 120, 600, 3600, 21600.
    private static final long[] BACKOFF_SECONDS = {5, 30, 120, 600, 3600, 21600};

    private final OutboxEventRepository repository;
    private final RabbitTemplate rabbit;

    @Scheduled(fixedDelayString = "PT5S", initialDelayString = "PT15S")
    @Transactional
    public void publish() {
        List<OutboxEvent> batch = repository.lockNextBatch(OffsetDateTime.now(), BATCH);
        if (batch.isEmpty()) return;
        log.debug("[Outbox] processando lote de {} eventos", batch.size());
        for (OutboxEvent e : batch) {
            tentar(e);
        }
    }

    private void tentar(OutboxEvent e) {
        try {
            rabbit.convertAndSend(RabbitConfig.EXCHANGE, e.getRoutingKey(), e.getPayload(), msg -> {
                MessageProperties props = msg.getMessageProperties();
                props.setMessageId(e.getMessageId().toString());
                props.setType(e.getEventType());
                props.setHeader("aggregate_id", String.valueOf(e.getAggregateId()));
                props.setHeader("aggregate_type", e.getAggregateType());
                return msg;
            });
            e.setStatus("PUBLISHED");
            e.setPublishedAt(OffsetDateTime.now());
            e.setLastError(null);
        } catch (RuntimeException ex) {
            int prox = e.getAttempts() + 1;
            e.setAttempts(prox);
            e.setLastError(safeMessage(ex));
            if (prox >= MAX_ATTEMPTS) {
                e.setStatus("PERMANENTLY_FAILED");
                log.error("[Outbox] {} PERMANENTLY_FAILED após {} tentativas: {}",
                        e.getMessageId(), prox, e.getLastError());
            } else {
                long espera = BACKOFF_SECONDS[Math.min(prox - 1, BACKOFF_SECONDS.length - 1)];
                e.setNextAttemptAt(OffsetDateTime.now().plus(Duration.ofSeconds(espera)));
                log.warn("[Outbox] {} tentativa {}/{} falhou — retry em {}s",
                        e.getMessageId(), prox, MAX_ATTEMPTS, espera);
            }
        }
    }

    private static String safeMessage(Throwable t) {
        String msg = t.getMessage();
        return msg != null && msg.length() > 800 ? msg.substring(0, 800) : msg;
    }
}
