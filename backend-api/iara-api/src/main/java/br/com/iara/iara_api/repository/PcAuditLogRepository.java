package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PcAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface PcAuditLogRepository extends JpaRepository<PcAuditLog, UUID> {

    @Query("""
            select l from PcAuditLog l
            where l.pcId = :pcId
              and (:eventoId is null or l.eventoId = :eventoId)
            order by l.createdAt desc
            """)
    Page<PcAuditLog> historico(@Param("pcId") UUID pcId,
                               @Param("eventoId") UUID eventoId,
                               Pageable pageable);

    @Query("""
            select l from PcAuditLog l
            where l.pcId = :pcId and l.atorId = :atorId
            order by l.createdAt desc
            """)
    Page<PcAuditLog> atividadeWorker(@Param("pcId") UUID pcId,
                                     @Param("atorId") UUID atorId,
                                     Pageable pageable);
}
