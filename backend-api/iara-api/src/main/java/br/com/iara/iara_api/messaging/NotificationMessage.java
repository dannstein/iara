package br.com.iara.iara_api.messaging;

import java.io.Serializable;
import java.util.UUID;

/**
 * Mensagem de notificação trafegada via RabbitMQ. O consumer persiste em iara_notificacao.
 *
 * @param usuarioId destinatário
 * @param titulo    título curto
 * @param mensagem  corpo
 * @param tipo      EVENTO | DEMANDA | ALERTA | PC | METEOROLOGICO | SISTEMA
 * @param refId     id da entidade relacionada (opcional)
 */
public record NotificationMessage(
        UUID usuarioId,
        String titulo,
        String mensagem,
        String tipo,
        UUID refId
) implements Serializable {
}
