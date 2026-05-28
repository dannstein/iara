package br.com.iara.iara_api.messaging;

import br.com.iara.iara_api.config.RabbitConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Publica notificações no exchange de tópico. A entrega em tempo real e a
 * persistência (iara_notificacao) acontecem no {@link NotificationConsumer}.
 */
@Component
@RequiredArgsConstructor
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void notify(UUID usuarioId, String titulo, String mensagem, String tipo, UUID refId) {
        NotificationMessage msg = new NotificationMessage(usuarioId, titulo, mensagem, tipo, refId);
        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, "notif." + tipo.toLowerCase(), msg);
    }
}
