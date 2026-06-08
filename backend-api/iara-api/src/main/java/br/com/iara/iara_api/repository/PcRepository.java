package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Pc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PcRepository extends JpaRepository<Pc, UUID> {

    @Query("""
            select p from Pc p
            where p.tenant.id in :tenantIds
              and (:isActive is null or p.isActive = :isActive)
              and (:isVerified is null or p.pcIsVerified = :isVerified)
              and (:pcTipo is null or p.pcTipo = :pcTipo)
              and (:statusVerificacao is null or p.statusVerificacao = :statusVerificacao)
            order by p.pcNome
            """)
    List<Pc> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                     @Param("isActive") Boolean isActive,
                     @Param("isVerified") Boolean isVerified,
                     @Param("pcTipo") String pcTipo,
                     @Param("statusVerificacao") String statusVerificacao);

    /** PCs mais próximos de uma coordenada dentro do raio em metros (query 1 do DDL, RF06). */
    @Query(value = """
            select * from iara_pc p
            where p.is_active = true
              and ST_DWithin(
                    p.pc_coords::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
            order by ST_Distance(
                    p.pc_coords::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) asc
            """, nativeQuery = true)
    List<Pc> proximos(@Param("lat") double lat, @Param("lng") double lng, @Param("raio") int raio);

    /** PCs ativos dentro do raio de um evento (para notificação na aprovação — query 1). */
    @Query(value = """
            select * from iara_pc p
            where p.is_active = true
              and ST_DWithin(
                    p.pc_coords::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography,
                    :raio)
            """, nativeQuery = true)
    List<Pc> ativosNoRaioDoEvento(@Param("eventoId") UUID eventoId, @Param("raio") int raio);

    /** Sub-fase 4A — verifica se um coordenador já tem PC ativo (validação 1:1). */
    boolean existsByCoordenadorIdAndIsActiveTrue(UUID coordenadorId);
}
