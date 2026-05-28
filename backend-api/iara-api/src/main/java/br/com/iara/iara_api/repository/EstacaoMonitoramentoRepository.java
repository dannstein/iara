package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.EstacaoMonitoramento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EstacaoMonitoramentoRepository extends JpaRepository<EstacaoMonitoramento, UUID> {
    List<EstacaoMonitoramento> findByTenantIdInOrderByNome(List<UUID> tenantIds);
}
