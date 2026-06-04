package br.com.iara.iara_api.service.channel;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.Usuario;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Canal LOG — sempre disponível, somente registra. Útil como baseline,
 * para testes, e como auditoria mínima quando nenhum canal externo está
 * configurado. Real delivery acontece via RabbitMQ + push WebSocket — este
 * canal documenta a tentativa.
 */
@Component
@Slf4j
public class LogNotificationChannel implements INotificationChannel {

    @Override
    public String id() {
        return "LOG";
    }

    @Override
    public NotificationResult send(Alerta alerta, Usuario destinatario) {
        log.info("[notify:LOG] alerta={} categoria={} severidade={} -> user={}",
                alerta.getId(), alerta.getCategoria(), alerta.getSeveridade(),
                destinatario.getId());
        return NotificationResult.ok();
    }
}
