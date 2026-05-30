package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.repository.AlertaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Roda a cada 60s e expira alertas ACTIVE cuja data_expiracao já passou
 * ou cuja auto_expire_minutes foi atingida.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaExpirationJob {

    private final AlertaRepository alertaRepository;

    @Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT30S")
    @Transactional
    public void expirarAlertas() {
        List<Alerta> expirados = alertaRepository.findExpired();
        if (expirados.isEmpty()) return;
        for (Alerta a : expirados) {
            a.setStatus("EXPIRED");
        }
        log.info("[AlertaExpirationJob] {} alertas expirados", expirados.size());
    }
}
