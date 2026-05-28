package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.InfraMunicipal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InfraMunicipalRepository extends JpaRepository<InfraMunicipal, UUID> {

    @Query("""
            select i from InfraMunicipal i
            where i.tenant.id in :tenantIds
              and (:tipo is null or i.tipo = :tipo)
            order by i.nome
            """)
    List<InfraMunicipal> filtrar(@Param("tenantIds") List<UUID> tenantIds, @Param("tipo") String tipo);

    /** Infraestrutura próxima a um evento (query 18 do DDL). */
    @Query(value = """
            select * from iara_infra_municipal i
            where i.is_active = true
              and ST_DWithin(
                    i.coordenadas::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography,
                    :raio)
            order by ST_Distance(
                    i.coordenadas::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography) asc
            """, nativeQuery = true)
    List<InfraMunicipal> proximosAoEvento(@Param("eventoId") UUID eventoId, @Param("raio") int raio);
}
