package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.EspecCategoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EspecCategoriaRepository extends JpaRepository<EspecCategoria, UUID> {

    /** Categorias globais (id_tenant null) + as do tenant informado. */
    @Query("select c from EspecCategoria c where c.tenant is null or c.tenant.id = :tenantId order by c.catNome")
    List<EspecCategoria> findGlobaisOuDoTenant(@Param("tenantId") UUID tenantId);
}
