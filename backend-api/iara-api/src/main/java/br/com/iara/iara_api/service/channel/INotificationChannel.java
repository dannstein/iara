package br.com.iara.iara_api.service.channel;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.Usuario;

/**
 * Adaptador de canal de notificação. Cada canal (LOG, EMAIL, SMS, WhatsApp, PUSH)
 * implementa esta interface como {@code @Component}.
 * O {@link NotificationChannelDispatcher} resolve quais canais executar para
 * cada alerta com base no estado global em {@code iara_app_config} e nas
 * preferências do usuário.
 */
public interface INotificationChannel {

    /** Identificador estável usado em config global e logs (ex: "LOG", "EMAIL"). */
    String id();

    /** Verifica configuração externa do canal (credenciais, conectividade). */
    default boolean isHealthy() {
        return true;
    }

    /**
     * Envia uma notificação para o usuário sobre o alerta.
     * Deve ser idempotente em retries — o dispatcher pode chamar novamente.
     *
     * @return resultado contendo status (ENVIADO|FALHOU|IGNORADO) e mensagem de erro opcional.
     */
    NotificationResult send(Alerta alerta, Usuario destinatario);

    record NotificationResult(String status, String erro) {
        public static NotificationResult ok() {
            return new NotificationResult("ENVIADO", null);
        }
        public static NotificationResult failed(String erro) {
            return new NotificationResult("FALHOU", erro);
        }
        public static NotificationResult ignored(String motivo) {
            return new NotificationResult("IGNORADO", motivo);
        }
    }
}
