package br.com.iara.iara_api.service.outbox;

import br.com.iara.iara_api.domain.OutboxEvent;
import br.com.iara.iara_api.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Sub-fase 4E — insere uma linha no Outbox na mesma transação do caller.
 * Garante atomicidade: ou o domínio E o evento são commitados, ou nada é.
 *
 * <p>O envio efetivo ao RabbitMQ é responsabilidade do
 * {@link OutboxPollerJob}, que lê PENDING periodicamente.</p>
 */
@Service
@RequiredArgsConstructor
public class OutboxPublisher {

    private final OutboxEventRepository repository;

    /**
     * Persiste o evento. {@code MANDATORY} força que o caller já esteja em
     * transação — impede uso acidental fora do domínio.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public OutboxEvent publish(String eventType, String aggregateType, UUID aggregateId,
                               String routingKey, Map<String, Object> payload) {
        OutboxEvent e = new OutboxEvent();
        e.setEventType(eventType);
        e.setAggregateType(aggregateType);
        e.setAggregateId(aggregateId);
        e.setRoutingKey(routingKey);
        e.setPayload(payload);
        e.setMessageId(UUID.randomUUID());
        return repository.save(e);
    }
}
