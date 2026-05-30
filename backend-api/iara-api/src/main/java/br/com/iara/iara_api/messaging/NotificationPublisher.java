package br.com.iara.iara_api.messaging;

import br.com.iara.iara_api.config.RabbitConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Publica notificações no exchange de tópico. A entrega em tempo real e a
 * persistência (iara_notificacao) acontecem no {@link NotificationConsumer}.
 *
 * <p>Para alertas com muitos destinatários, use {@link #dispatchAlert} que
 * particiona em chunks e publica no routing key {@code alert.<severidade>}.
 */
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private static final int ALERT_CHUNK_SIZE = 500;

    private final RabbitTemplate rabbitTemplate;

    public void notify(UUID usuarioId, String titulo, String mensagem, String tipo, UUID refId) {
        NotificationMessage msg = new NotificationMessage(usuarioId, titulo, mensagem, tipo, refId);
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "notif." + tipo.toLowerCase(), msg);
    }

    /**
     * Publica uma notificação para cada userId em lotes de até 500 ids,
     * com routing key {@code alert.<severidade>} (tópico — direcionável a queues específicos).
     */
    public void dispatchAlert(UUID alertaId, String titulo, String mensagem, String severidade,
                              List<UUID> destinatarios) {
        String severidadeKey = severidade != null ? severidade.toLowerCase() : "info";
        String routingKey = "alert." + severidadeKey;

        for (int i = 0; i < destinatarios.size(); i += ALERT_CHUNK_SIZE) {
            int end = Math.min(i + ALERT_CHUNK_SIZE, destinatarios.size());
            List<UUID> chunk = destinatarios.subList(i, end);
            AlertDispatchMessage msg = new AlertDispatchMessage(alertaId, titulo, mensagem, severidade, chunk);
            rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, routingKey, msg);
        }
    }
}
