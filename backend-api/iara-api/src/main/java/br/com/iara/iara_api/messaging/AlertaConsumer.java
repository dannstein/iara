package br.com.iara.iara_api.messaging;

import br.com.iara.iara_api.config.RabbitConfig;
import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.AlertaDestinatario;
import br.com.iara.iara_api.domain.Notificacao;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.repository.AlertaDestinatarioRepository;
import br.com.iara.iara_api.repository.AlertaRepository;
import br.com.iara.iara_api.repository.NotificacaoRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Consumer de mensagens AlertDispatchMessage. Para cada usuarioId no chunk:
 * - cria uma {@link Notificacao} no banco
 * - atualiza a linha {@link AlertaDestinatario} (status DELIVERED + delivered_at)
 *
 * Falhas individuais são logadas mas não interrompem o batch.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaConsumer {

    private final AlertaRepository alertaRepository;
    private final AlertaDestinatarioRepository destinatarioRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;

    @RabbitListener(queues = RabbitConfig.ALERTS_QUEUE)
    @Transactional
    public void onAlert(AlertDispatchMessage msg) {
        Alerta alerta = alertaRepository.findById(msg.alertaId()).orElse(null);
        if (alerta == null) {
            log.warn("Alerta {} não encontrado — chunk descartado", msg.alertaId());
            return;
        }
        OffsetDateTime now = OffsetDateTime.now();
        for (UUID usuarioId : msg.usuarioIds()) {
            try {
                Usuario u = usuarioRepository.findById(usuarioId).orElse(null);
                if (u == null) {
                    markFailed(msg.alertaId(), usuarioId, "Usuário removido");
                    continue;
                }
                // Persiste notificação para que apareça no /notificacoes do usuário
                Notificacao n = new Notificacao();
                n.setUsuario(u);
                n.setTitulo(msg.titulo() != null ? msg.titulo() : "Alerta");
                n.setMensagem(msg.mensagem());
                n.setTipo("ALERTA");
                n.setIdRef(msg.alertaId());
                notificacaoRepository.save(n);

                // Atualiza delivery_status para DELIVERED
                destinatarioRepository.findByAlertaIdAndUsuarioId(msg.alertaId(), usuarioId).ifPresent(d -> {
                    if ("SENT".equals(d.getDeliveryStatus())) {
                        d.setDeliveryStatus("DELIVERED");
                        d.setDeliveredAt(now);
                    }
                });
            } catch (Exception e) {
                log.error("Falha entregando alerta {} para usuário {}: {}",
                        msg.alertaId(), usuarioId, e.getMessage());
                markFailed(msg.alertaId(), usuarioId, e.getMessage());
            }
        }
    }

    private void markFailed(UUID alertaId, UUID usuarioId, String reason) {
        destinatarioRepository.findByAlertaIdAndUsuarioId(alertaId, usuarioId).ifPresent(d -> {
            d.setDeliveryStatus("FAILED");
            d.setFailureReason(reason);
        });
    }
}
