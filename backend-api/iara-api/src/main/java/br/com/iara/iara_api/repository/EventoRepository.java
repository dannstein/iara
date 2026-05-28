package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EventoRepository extends JpaRepository<Evento, UUID> {

    @Query("""
            select e from Evento e
            where e.tenant.id in :tenantIds
              and (:status is null or e.status = :status)
              and (:severidade is null or e.severidade = :severidade)
              and (:tipoId is null or e.tipo.id = :tipoId)
              and (:isSimulado is null or e.isSimulado = :isSimulado)
            order by e.dataSolicitacao desc
            """)
    List<Evento> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                         @Param("status") String status,
                         @Param("severidade") String severidade,
                         @Param("tipoId") UUID tipoId,
                         @Param("isSimulado") Boolean isSimulado);
}
