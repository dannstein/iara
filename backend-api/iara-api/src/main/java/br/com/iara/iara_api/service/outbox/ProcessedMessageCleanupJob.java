package br.com.iara.iara_api.service.outbox;

import br.com.iara.iara_api.repository.ProcessedMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

/**
 * Sub-fase 4E — limpa marcações de idempotency com mais de 24h. Roda às 04:00.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ProcessedMessageCleanupJob {

    private final ProcessedMessageRepository repository;

    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void cleanup() {
        OffsetDateTime corte = OffsetDateTime.now().minusHours(24);
        int n = repository.purgeOlderThan(corte);
        if (n > 0) log.info("[ProcessedMessageCleanup] {} linhas removidas", n);
    }
}
