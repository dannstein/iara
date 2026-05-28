package br.com.iara.iara_api.integration.stub;

import br.com.iara.iara_api.integration.SmsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Stub de SMS: apenas registra em log. Substituível por provedor real via profile.
 */
@Slf4j
@Service
public class SmsServiceStub implements SmsService {

    @Override
    public void enviar(String telefone, String mensagem) {
        log.info("[SMS-STUB] para={} mensagem={}", telefone, mensagem);
    }
}
