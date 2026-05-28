package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    List<Tenant> findByPaiId(UUID paiId);

    /** Tenants raiz (sem pai) — usado para montar a hierarquia completa do ADMIN. */
    List<Tenant> findByPaiIsNull();

    @Query("select t.id from Tenant t")
    List<UUID> findAllIds();
}
