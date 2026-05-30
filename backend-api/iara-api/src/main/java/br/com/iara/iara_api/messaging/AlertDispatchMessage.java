package br.com.iara.iara_api.messaging;

import java.io.Serializable;
import java.util.List;
import java.util.UUID;

/**
 * Mensagem de fan-out de alerta: contém um chunk de destinatários e os metadados
 * para entregar uma notificação a cada um. Processada por {@link AlertaConsumer}.
 */
public record AlertDispatchMessage(
        UUID alertaId,
        String titulo,
        String mensagem,
        String severidade,
        List<UUID> usuarioIds
) implements Serializable {
}
