package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.SolicitacaoHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SolicitacaoHistoricoRepository extends JpaRepository<SolicitacaoHistorico, UUID> {

    List<SolicitacaoHistorico> findBySolicitacaoIdOrderByCreatedAtAsc(UUID solicitacaoId);
}
