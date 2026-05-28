package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.RecursoDcEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecursoDcEventoRepository extends JpaRepository<RecursoDcEvento, UUID> {

    List<RecursoDcEvento> findByEventoId(UUID eventoId);

    Optional<RecursoDcEvento> findByEventoIdAndRecursoId(UUID eventoId, UUID recursoId);
}
