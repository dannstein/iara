package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.EventoHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventoHistoricoRepository extends JpaRepository<EventoHistorico, UUID> {
    List<EventoHistorico> findByEventoIdOrderByCreatedAtDesc(UUID eventoId);
}
