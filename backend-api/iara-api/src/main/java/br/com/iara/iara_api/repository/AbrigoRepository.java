package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Abrigo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AbrigoRepository extends JpaRepository<Abrigo, UUID> {

    @Query("""
            select a from Abrigo a
            where a.tenant.id in :tenantIds
              and (:isActive is null or a.isActive = :isActive)
              and (:eventoId is null or a.evento.id = :eventoId)
            order by a.nome
            """)
    List<Abrigo> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                         @Param("isActive") Boolean isActive,
                         @Param("eventoId") UUID eventoId);

    /** Abrigos com vagas próximos a um evento (query 14 do DDL), ordenados por distância. */
    @Query(value = """
            select * from iara_abrigo a
            where a.is_active = true
              and a.ocupacao_atual < a.capacidade_total
              and ST_DWithin(
                    a.coordenadas::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography,
                    :raio)
            order by ST_Distance(
                    a.coordenadas::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography) asc
            """, nativeQuery = true)
    List<Abrigo> comVagasProximosAoEvento(@Param("eventoId") UUID eventoId, @Param("raio") int raio);
}
