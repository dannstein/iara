package br.com.iara.iara_api.integration;

/**
 * Envio de SMS para equipes em campo sem dados móveis.
 * Implementação real (Twilio/operadora) substitui o stub via profile.
 */
public interface SmsService {
    void enviar(String telefone, String mensagem);
}
