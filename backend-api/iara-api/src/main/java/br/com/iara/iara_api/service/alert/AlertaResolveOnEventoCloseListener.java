package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.repository.AlertaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Listener: quando um Evento é encerrado/cancelado, marca como RESOLVED todos os
 * alertas ATIVOS vinculados a ele.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaResolveOnEventoCloseListener {

    private final AlertaRepository alertaRepository;

    @EventListener
    @Transactional
    public void onEventoEncerrado(EventoEncerradoEvent event) {
        List<Alerta> ativos = alertaRepository.findByEventoIdAndStatus(event.eventoId(), "ACTIVE");
        if (ativos.isEmpty()) return;
        OffsetDateTime now = OffsetDateTime.now();
        for (Alerta a : ativos) {
            a.setStatus("RESOLVED");
            a.setDataResolvido(now);
        }
        log.info("[AlertaResolveListener] {} alertas resolvidos pelo encerramento do evento {}",
                ativos.size(), event.eventoId());
    }
}
