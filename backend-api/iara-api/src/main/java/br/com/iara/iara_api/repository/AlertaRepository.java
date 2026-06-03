package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Alerta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AlertaRepository extends JpaRepository<Alerta, UUID> {

    List<Alerta> findByTenantIdInOrderByCreatedAtDesc(List<UUID> tenantIds);

    @Query("""
            select a from Alerta a
            where a.tenant.id in :tenantIds
              and (:status is null or a.status = :status)
              and (:severidade is null or a.severidade = :severidade)
              and (:categoria is null or a.categoria = :categoria)
              and (:idEvento is null or a.evento.id = :idEvento)
              and (:idZonaRisco is null or a.zonaRisco.id = :idZonaRisco)
            order by a.createdAt desc
            """)
    List<Alerta> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                         @Param("status") String status,
                         @Param("severidade") String severidade,
                         @Param("categoria") String categoria,
                         @Param("idEvento") UUID idEvento,
                         @Param("idZonaRisco") UUID idZonaRisco);

    /** Geofencing (query 3 do DDL): alertas cuja área contém a coordenada. */
    @Query(value = """
            select * from iara_alerta a
            where a.area_alerta is not null
              and a.id_tenant in (:tenantIds)
              and a.status = 'ACTIVE'
              and ST_Contains(a.area_alerta, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            order by a.created_at desc
            """, nativeQuery = true)
    List<Alerta> geofencing(@Param("lat") double lat, @Param("lng") double lng,
                            @Param("tenantIds") List<UUID> tenantIds);

    /** Alertas ativos cuja expiração já passou (job de expiração). */
    @Query(value = """
            select * from iara_alerta a
            where a.status = 'ACTIVE'
              and (
                (a.data_expiracao is not null and a.data_expiracao < now())
                or
                (a.auto_expire_minutes is not null
                 and a.created_at + (a.auto_expire_minutes || ' minutes')::interval < now())
              )
            """, nativeQuery = true)
    List<Alerta> findExpired();

    /** Alertas ativos vinculados a um evento (para resolução automática quando evento fecha). */
    List<Alerta> findByEventoIdAndStatus(UUID eventoId, String status);

    long countByTenantIdInAndStatus(List<UUID> tenantIds, String status);

    long countByTenantIdInAndStatusAndSeveridadeIn(List<UUID> tenantIds, String status, List<String> severidades);

    long countByTenantIdInAndStatusAndDataResolvidoGreaterThanEqual(List<UUID> tenantIds, String status,
                                                                   OffsetDateTime dataResolvido);

    @Modifying
    @Query("update Alerta a set a.totalDestinatarios = :total where a.id = :id")
    int updateTotalDestinatarios(@Param("id") UUID id, @Param("total") int total);

    /** Alertas ACTIVE com configuração de expansão de raio pendente (2B). */
    @Query("""
            select a from Alerta a
            where a.status = 'ACTIVE'
              and a.requerAck = true
              and a.expansionRadiiMetros is not null
            """)
    List<Alerta> findExpansionCandidates();
}
