package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.EventoAvaliacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EventoAvaliacaoRepository extends JpaRepository<EventoAvaliacao, UUID> {
    List<EventoAvaliacao> findByEventoIdOrderByCreatedAtDesc(UUID eventoId);

    boolean existsByEventoIdAndUsuarioId(UUID eventoId, UUID usuarioId);
}
