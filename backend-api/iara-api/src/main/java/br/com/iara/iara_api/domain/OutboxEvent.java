package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Linha do Transactional Outbox (sub-fase 4E). Inserida na mesma transação do
 * domínio. O {@code OutboxPollerJob} lê PENDING e publica no RabbitMQ com header
 * {@code message_id}; em falha aplica backoff em {@code nextAttemptAt}.
 *
 * Status: PENDING → PUBLISHED (sucesso) ou PERMANENTLY_FAILED (após N tentativas).
 */
@Entity
@Table(name = "iara_outbox_event")
@Getter
@Setter
@NoArgsConstructor
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(name = "aggregate_id", nullable = false)
    private UUID aggregateId;

    @Column(name = "aggregate_type", length = 40)
    private String aggregateType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "routing_key", nullable = false, length = 100)
    private String routingKey;

    @Column(name = "message_id", nullable = false, unique = true)
    private UUID messageId = UUID.randomUUID();

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "next_attempt_at", nullable = false)
    private OffsetDateTime nextAttemptAt = OffsetDateTime.now();

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false,
            insertable = false)
    private OffsetDateTime createdAt;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;
}
