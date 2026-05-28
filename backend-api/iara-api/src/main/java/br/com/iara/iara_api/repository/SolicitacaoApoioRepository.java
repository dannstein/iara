package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.SolicitacaoApoio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SolicitacaoApoioRepository extends JpaRepository<SolicitacaoApoio, UUID> {
    List<SolicitacaoApoio> findByEventoIdOrderByCreatedAtDesc(UUID eventoId);
}
