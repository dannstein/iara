package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.ZonaRisco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ZonaRiscoRepository extends JpaRepository<ZonaRisco, UUID> {

    List<ZonaRisco> findByTenantIdInAndIsActiveTrueOrderByNivelRiscoDesc(List<UUID> tenantIds);

    /** Geofencing (query 3): zonas de risco ativas que contêm a coordenada. */
    @Query(value = """
            select * from iara_zona_risco z
            where z.is_active = true
              and ST_Contains(z.geometria, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            order by z.nivel_risco desc
            """, nativeQuery = true)
    List<ZonaRisco> geofencing(@Param("lat") double lat, @Param("lng") double lng);

    /** Zonas de risco próximas a uma coordenada (query 6 — sugestão ao criar evento). */
    @Query(value = """
            select * from iara_zona_risco z
            where z.is_active = true
              and ST_DWithin(
                    z.geometria::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
            order by ST_Distance(
                    z.geometria::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) asc
            """, nativeQuery = true)
    List<ZonaRisco> proximas(@Param("lat") double lat, @Param("lng") double lng, @Param("raio") int raio);
}
