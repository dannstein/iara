package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.SolicitacaoServico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SolicitacaoServicoRepository extends JpaRepository<SolicitacaoServico, UUID> {

    List<SolicitacaoServico> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);

    List<SolicitacaoServico> findByTenantIdInOrderByCreatedAtDesc(List<UUID> tenantIds);
}
