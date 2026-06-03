package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AlertaAutomaticoLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface AlertaAutomaticoLogRepository extends JpaRepository<AlertaAutomaticoLog, UUID> {

    @Query("""
            select l from AlertaAutomaticoLog l
            where l.tenant.id = :tenantId
              and (:ruleId is null or l.ruleId = :ruleId)
            order by l.createdAt desc
            """)
    Page<AlertaAutomaticoLog> listar(@Param("tenantId") UUID tenantId,
                                     @Param("ruleId") String ruleId,
                                     Pageable pageable);
}
