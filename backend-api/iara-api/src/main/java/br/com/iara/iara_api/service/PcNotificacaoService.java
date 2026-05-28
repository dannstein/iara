package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.Pc;
import br.com.iara.iara_api.domain.PcEvento;
import br.com.iara.iara_api.messaging.NotificationPublisher;
import br.com.iara.iara_api.repository.PcEventoRepository;
import br.com.iara.iara_api.repository.PcRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Na aprovação de um evento (query 1 do DDL): cria vínculos PC↔evento NOTIFICADO
 * para os PCs ativos dentro do raio e notifica os coordenadores.
 * Sem dependência de EventoService — evita ciclo.
 */
@Service
@RequiredArgsConstructor
public class PcNotificacaoService {

    private final PcRepository pcRepository;
    private final PcEventoRepository pcEventoRepository;
    private final NotificationPublisher notificationPublisher;

    @Transactional
    public void notificarPcsProximos(Evento evento) {
        for (Pc pc : pcRepository.ativosNoRaioDoEvento(evento.getId(), evento.getRaioMetros())) {
            if (pcEventoRepository.existsByPcIdAndEventoId(pc.getId(), evento.getId())) {
                continue;
            }
            PcEvento pe = new PcEvento();
            pe.setPc(pc);
            pe.setEvento(evento);
            pe.setStatus("NOTIFICADO");
            pcEventoRepository.save(pe);
            notificationPublisher.notify(pc.getCoordenador().getId(),
                    "Evento próximo ao seu PC: " + evento.getTitulo(),
                    "Um evento foi ativado próximo ao seu ponto de coleta. Aceite para receber demandas.",
                    "PC", evento.getId());
        }
    }
}
