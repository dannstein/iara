package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.EventoEspecNecessaria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventoEspecNecessariaRepository extends JpaRepository<EventoEspecNecessaria, UUID> {
    List<EventoEspecNecessaria> findByEventoId(UUID eventoId);

    Optional<EventoEspecNecessaria> findByEventoIdAndEspecId(UUID eventoId, UUID especId);
}
