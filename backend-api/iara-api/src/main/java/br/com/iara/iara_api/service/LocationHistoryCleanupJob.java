package br.com.iara.iara_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Job diário às 03:00 que apaga pontos do histórico de localização mais antigos
 * que 7 dias. Retenção pequena por LGPD (Art. 7 VII — interesses vitais).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class LocationHistoryCleanupJob {

    private final JdbcTemplate jdbcTemplate;

    @Scheduled(cron = "0 0 3 * * *")
    public void cleanup() {
        int removed = jdbcTemplate.update(
                "delete from iara_usuario_localizacao_historico where captured_at < now() - interval '7 days'");
        if (removed > 0) {
            log.info("[LocationHistoryCleanupJob] {} pontos antigos removidos", removed);
        }
    }
}
