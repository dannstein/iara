package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.ProcessedMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;

public interface ProcessedMessageRepository
        extends JpaRepository<ProcessedMessage, ProcessedMessage.Key> {

    @Modifying
    @Query(value = "delete from iara_processed_message where processed_at < :corte",
           nativeQuery = true)
    int purgeOlderThan(@Param("corte") OffsetDateTime corte);
}
