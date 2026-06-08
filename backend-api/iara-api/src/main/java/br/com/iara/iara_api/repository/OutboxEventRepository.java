package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.OutboxEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, java.util.UUID> {

    /**
     * Lê o próximo lote PENDING cuja janela de retry já passou. {@code FOR UPDATE
     * SKIP LOCKED} no próprio SQL permite múltiplos pollers concorrentes sem
     * bloqueio (não dá pra usar {@code @Lock} em native query).
     */
    @Query(value = """
            select * from iara_outbox_event
            where status = 'PENDING' and next_attempt_at <= :now
            order by created_at
            limit :max
            for update skip locked
            """, nativeQuery = true)
    List<OutboxEvent> lockNextBatch(@Param("now") OffsetDateTime now, @Param("max") int max);
}
