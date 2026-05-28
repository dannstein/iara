package br.com.iara.iara_api.integration.stub;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Stub do job de ingestão meteorológica (CEMADEN/INMET). Em produção consome a API
 * externa e insere em iara_medicao preservando o payload em dados_raw.
 * Aqui apenas registra um heartbeat — substituível por implementação real via profile.
 */
@Slf4j
@Component
public class WeatherIngestionJob {

    @Scheduled(fixedDelayString = "PT30M")
    public void ingerir() {
        log.debug("[WEATHER-STUB] ciclo de ingestão meteorológica (no-op em dev)");
    }
}
