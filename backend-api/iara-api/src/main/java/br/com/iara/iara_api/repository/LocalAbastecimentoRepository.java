package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.LocalAbastecimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LocalAbastecimentoRepository extends JpaRepository<LocalAbastecimento, UUID> {

    List<LocalAbastecimento> findByTenantIdInOrderByNome(List<UUID> tenantIds);

    /** Locais de abastecimento mais próximos de uma coordenada (query 8/RN16), 5 dentro do raio. */
    @Query(value = """
            select * from iara_local_abastecimento l
            where l.is_active = true
              and (cast(:tipo as varchar) is null or l.tipo = :tipo)
              and ST_DWithin(
                    l.coordenadas::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
            order by ST_Distance(
                    l.coordenadas::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) asc
            limit 5
            """, nativeQuery = true)
    List<LocalAbastecimento> proximos(@Param("lat") double lat, @Param("lng") double lng,
                                      @Param("raio") int raio, @Param("tipo") String tipo);
}
