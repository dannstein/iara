package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AlertaAutomatico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertaAutomaticoRepository extends JpaRepository<AlertaAutomatico, UUID> {

    Optional<AlertaAutomatico> findByTenantIdAndRuleId(UUID tenantId, String ruleId);

    List<AlertaAutomatico> findByTenantId(UUID tenantId);

    @Query("""
            select a from AlertaAutomatico a
            where a.ruleId = :ruleId and a.ativo = true
            """)
    List<AlertaAutomatico> findActiveByRuleId(@Param("ruleId") String ruleId);
}
