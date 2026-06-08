package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, UUID> {

    List<InventoryTransaction> findByPcIdOrderByCreatedAtDesc(UUID pcId);

    @Query("""
            select t from InventoryTransaction t
            where t.pcId = :pcId
              and (:eventoId is null or t.eventoId = :eventoId)
            order by t.createdAt desc
            """)
    List<InventoryTransaction> listar(@Param("pcId") UUID pcId,
                                      @Param("eventoId") UUID eventoId);
}
