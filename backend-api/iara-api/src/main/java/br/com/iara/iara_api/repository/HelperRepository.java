package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Helper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HelperRepository extends JpaRepository<Helper, UUID> {

    @Query("""
            select h from Helper h
            where h.pc.id = :pcId
              and (:status is null or h.status = :status)
            order by h.createdAt desc
            """)
    List<Helper> listarPorPc(@Param("pcId") UUID pcId, @Param("status") String status);

    Optional<Helper> findByUsuarioIdAndPcId(UUID usuarioId, UUID pcId);
}
