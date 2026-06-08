package br.com.iara.iara_api.service.outbox;

import br.com.iara.iara_api.domain.ProcessedMessage;
import br.com.iara.iara_api.repository.ProcessedMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Sub-fase 4E — checa se uma {@code message_id} já foi processada pelo consumer
 * informado. Consumers devem chamar {@code markIfFirst} no início da
 * mensagem; se {@code false}, descartam silenciosamente.
 *
 * Usa {@code REQUIRES_NEW} para não vincular a marcação à transação do consumer:
 * se o processamento falhar e for re-entregue, a marca permanece e a segunda
 * passagem é descartada — comportamento "exactly-once" prático.
 */
@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final ProcessedMessageRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean markIfFirst(UUID messageId, String consumer) {
        if (messageId == null) return true; // sem id → trata sempre (compat legado)
        if (repository.existsById(new ProcessedMessage.Key(messageId, consumer))) {
            return false;
        }
        ProcessedMessage m = new ProcessedMessage();
        m.setMessageId(messageId);
        m.setConsumer(consumer);
        try {
            repository.save(m);
            return true;
        } catch (DataIntegrityViolationException race) {
            // Outro consumer venceu a corrida; trata como duplicata.
            return false;
        }
    }
}
