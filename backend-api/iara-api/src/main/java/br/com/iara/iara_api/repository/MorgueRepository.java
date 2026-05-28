package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Morgue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MorgueRepository extends JpaRepository<Morgue, UUID> {

    List<Morgue> findByEventoIdOrderByCreatedAtDesc(UUID eventoId);

    Optional<Morgue> findByEventoIdAndCodigoMorgue(UUID eventoId, String codigoMorgue);

    List<Morgue> findByRegistradoPorIdAndDataSincronizacaoIsNull(UUID registradoPorId);
}
