package br.com.iara.iara_api.service.channel;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.Usuario;
import org.springframework.stereotype.Component;

/**
 * Canal EMAIL — stub. Aceita configuração mas não envia até que um JavaMailSender
 * com SMTP real seja configurado. Marca como IGNORADO para deixar claro que o
 * envio não aconteceu (não é falha, é "no-op pendente de configuração").
 */
@Component
public class EmailNotificationChannel implements INotificationChannel {

    @Override
    public String id() {
        return "EMAIL";
    }

    @Override
    public boolean isHealthy() {
        // TODO: ativar quando SMTP estiver configurado em application.properties.
        return false;
    }

    @Override
    public NotificationResult send(Alerta alerta, Usuario destinatario) {
        return NotificationResult.ignored("Canal EMAIL ainda não configurado");
    }
}
