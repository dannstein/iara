package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PontoAtencao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PontoAtencaoRepository extends JpaRepository<PontoAtencao, UUID> {

    @Query("""
            select p from PontoAtencao p
            where p.tenant.id in :tenantIds
              and (:isActive is null or p.isActive = :isActive)
              and (:isIndustrial is null or p.isIndustrial = :isIndustrial)
              and (:situacaoApoio is null or p.situacaoApoio = :situacaoApoio)
            order by p.nivelRisco desc
            """)
    List<PontoAtencao> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                               @Param("isActive") Boolean isActive,
                               @Param("isIndustrial") Boolean isIndustrial,
                               @Param("situacaoApoio") String situacaoApoio);

    /** Pontos de atenção próximos a uma coordenada (query 15). */
    @Query(value = """
            select * from iara_ponto_atencao p
            where p.is_active = true
              and ST_DWithin(
                    p.geometria::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
            order by ST_Distance(
                    p.geometria::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) asc
            """, nativeQuery = true)
    List<PontoAtencao> proximos(@Param("lat") double lat, @Param("lng") double lng, @Param("raio") int raio);

    /** Pontos sem apoio (query 19, RN21) — painel de lacunas, por nível de risco e população. */
    @Query("""
            select p from PontoAtencao p
            where p.tenant.id in :tenantIds and p.situacaoApoio = 'SEM_APOIO' and p.isActive = true
            order by p.nivelRisco desc, p.populacaoEstimada desc
            """)
    List<PontoAtencao> semApoio(@Param("tenantIds") List<UUID> tenantIds);

    /** Pontos industriais (query 16, RN23). */
    @Query("""
            select p from PontoAtencao p
            where p.tenant.id in :tenantIds and p.isIndustrial = true and p.isActive = true
            order by p.nivelRisco desc
            """)
    List<PontoAtencao> industriais(@Param("tenantIds") List<UUID> tenantIds);
}
