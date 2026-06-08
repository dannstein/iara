package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Marcação de idempotency de consumer (sub-fase 4E). Inserida na primeira vez
 * que o consumer processa uma {@code message_id}. Reaparições reentregues pelo
 * broker são descartadas pelo {@code IdempotencyService}.
 */
@Entity
@Table(name = "iara_processed_message")
@IdClass(ProcessedMessage.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class ProcessedMessage {

    @Id
    @Column(name = "message_id")
    private UUID messageId;

    @Id
    @Column(length = 60)
    private String consumer;

    @Column(name = "processed_at", nullable = false)
    private OffsetDateTime processedAt = OffsetDateTime.now();

    public static class Key implements Serializable {
        private UUID messageId;
        private String consumer;

        public Key() {}
        public Key(UUID messageId, String consumer) {
            this.messageId = messageId;
            this.consumer = consumer;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key k)) return false;
            return Objects.equals(messageId, k.messageId)
                    && Objects.equals(consumer, k.consumer);
        }

        @Override
        public int hashCode() {
            return Objects.hash(messageId, consumer);
        }
    }
}
