package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface HospitalRepository extends JpaRepository<Hospital, UUID> {

    List<Hospital> findByTenantIdInOrderByNome(List<UUID> tenantIds);

    /** Hospitais com leitos disponíveis próximos a uma coordenada (query 7 do DDL). */
    @Query(value = """
            select * from iara_hospital h
            where h.is_active = true
              and coalesce(h.leitos_disponiveis, 0) > 0
              and ST_DWithin(
                    h.coordenadas::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
            order by ST_Distance(
                    h.coordenadas::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) asc
            """, nativeQuery = true)
    List<Hospital> comLeitosProximos(@Param("lat") double lat, @Param("lng") double lng,
                                     @Param("raio") int raio);
}
