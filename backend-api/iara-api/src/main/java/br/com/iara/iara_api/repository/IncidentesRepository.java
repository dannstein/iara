package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Incidentes;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncidentesRepository extends JpaRepository<Incidentes, UUID> {

    List<Incidentes> findByEventoIdOrderByCreatedAtDesc(UUID eventoId);

    Optional<Incidentes> findFirstByEventoIdOrderByCreatedAtDesc(UUID eventoId);
}
