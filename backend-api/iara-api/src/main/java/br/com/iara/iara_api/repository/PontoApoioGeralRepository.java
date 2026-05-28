package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PontoApoioGeral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PontoApoioGeralRepository extends JpaRepository<PontoApoioGeral, UUID> {

    List<PontoApoioGeral> findByTenantIdInOrderByNome(List<UUID> tenantIds);

    /** Pontos de apoio livres (sem zona) e ativos no escopo do tenant. */
    List<PontoApoioGeral> findByTenantIdInAndZonaRiscoIsNullAndIsActiveTrueOrderByNome(List<UUID> tenantIds);

    List<PontoApoioGeral> findByZonaRiscoIdAndIsActiveTrue(UUID zonaId);

    /** Distância (metros) entre uma zona de risco e um ponto de apoio. */
    @Query(value = """
            select ST_Distance(z.geometria::geography, p.geometria::geography)
            from iara_zona_risco z, iara_ponto_apoio_geral p
            where z.id = :zonaId and p.id = :apoioId
            """, nativeQuery = true)
    Double distanciaMetros(@Param("zonaId") UUID zonaId, @Param("apoioId") UUID apoioId);
}
