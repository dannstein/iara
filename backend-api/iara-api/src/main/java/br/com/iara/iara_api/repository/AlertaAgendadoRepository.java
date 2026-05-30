package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AlertaAgendado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AlertaAgendadoRepository extends JpaRepository<AlertaAgendado, UUID> {

    @Query("""
            select a from AlertaAgendado a
            where a.tenant.id in :tenantIds
              and (:ativo is null or a.isAtivo = :ativo)
              and (:categoria is null or a.categoria = :categoria)
            order by a.proximaExecucao asc
            """)
    List<AlertaAgendado> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                                  @Param("ativo") Boolean ativo,
                                  @Param("categoria") String categoria);

    /** Agendamentos prontos para disparar agora. Usado pelo AlertaSchedulerJob. */
    @Query("""
            select a from AlertaAgendado a
            where a.isAtivo = true
              and a.proximaExecucao <= :now
              and (a.fim is null or a.proximaExecucao <= a.fim)
            order by a.proximaExecucao asc
            """)
    List<AlertaAgendado> findDueForExecution(@Param("now") OffsetDateTime now);
}
