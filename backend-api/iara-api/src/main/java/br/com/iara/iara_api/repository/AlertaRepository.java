package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AlertaRepository extends JpaRepository<Alerta, UUID> {

    List<Alerta> findByTenantIdInOrderByCreatedAtDesc(List<UUID> tenantIds);

    /** Geofencing (query 3 do DDL): alertas cuja área contém a coordenada. */
    @Query(value = """
            select * from iara_alerta a
            where a.area_alerta is not null
              and a.id_tenant in (:tenantIds)
              and ST_Contains(a.area_alerta, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            order by a.created_at desc
            """, nativeQuery = true)
    List<Alerta> geofencing(@Param("lat") double lat, @Param("lng") double lng,
                            @Param("tenantIds") List<UUID> tenantIds);
}
