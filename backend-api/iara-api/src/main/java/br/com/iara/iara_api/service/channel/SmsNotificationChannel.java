package br.com.iara.iara_api.service.channel;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.Usuario;
import org.springframework.stereotype.Component;

/**
 * Canal SMS — stub. Aguarda credenciais (Twilio / provedor brasileiro).
 */
@Component
public class SmsNotificationChannel implements INotificationChannel {

    @Override
    public String id() {
        return "SMS";
    }

    @Override
    public boolean isHealthy() {
        return false;
    }

    @Override
    public NotificationResult send(Alerta alerta, Usuario destinatario) {
        return NotificationResult.ignored("Canal SMS ainda não configurado");
    }
}
