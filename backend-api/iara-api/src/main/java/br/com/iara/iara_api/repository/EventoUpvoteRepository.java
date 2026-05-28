package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.EventoUpvote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EventoUpvoteRepository extends JpaRepository<EventoUpvote, UUID> {
    boolean existsByEventoIdAndUsuarioId(UUID eventoId, UUID usuarioId);

    Optional<EventoUpvote> findByEventoIdAndUsuarioId(UUID eventoId, UUID usuarioId);

    long countByEventoId(UUID eventoId);
}
