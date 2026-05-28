package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Espec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EspecRepository extends JpaRepository<Espec, UUID> {

    /** Subcategorias globais + do tenant, opcionalmente filtradas por categoria. */
    @Query("""
            select e from Espec e
            where (e.tenant is null or e.tenant.id = :tenantId)
              and (:categoriaId is null or e.categoria.id = :categoriaId)
            order by e.especNome
            """)
    List<Espec> findGlobaisOuDoTenant(@Param("tenantId") UUID tenantId,
                                      @Param("categoriaId") UUID categoriaId);

    boolean existsByCategoriaIdAndEspecNome(UUID categoriaId, String especNome);

    List<Espec> findByCategoriaIdOrderByEspecNome(UUID categoriaId);
}
