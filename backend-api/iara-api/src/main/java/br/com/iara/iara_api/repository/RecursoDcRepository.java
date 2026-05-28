package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.RecursoDc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface RecursoDcRepository extends JpaRepository<RecursoDc, UUID> {

    @Query("""
            select r from RecursoDc r
            where r.tenant.id in :tenantIds
              and (:status is null or r.status = :status)
              and (:tipoId is null or r.tipo.id = :tipoId)
            order by r.identificacao
            """)
    List<RecursoDc> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                            @Param("status") String status,
                            @Param("tipoId") UUID tipoId);

    /** Recursos DISPONIVEL próximos a um evento (query 8 do DDL). */
    @Query(value = """
            select * from iara_recurso_dc r
            where r.status = 'DISPONIVEL'
              and r.localizacao is not null
              and ST_DWithin(
                    r.localizacao::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography,
                    :raio)
            order by ST_Distance(
                    r.localizacao::geography,
                    (select coordenadas from iara_evento where id = :eventoId)::geography) asc
            """, nativeQuery = true)
    List<RecursoDc> disponiveisProximos(@Param("eventoId") UUID eventoId, @Param("raio") int raio);
}
