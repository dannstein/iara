package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PcEvento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PcEventoRepository extends JpaRepository<PcEvento, UUID> {

    List<PcEvento> findByPcId(UUID pcId);

    List<PcEvento> findByEventoIdAndStatus(UUID eventoId, String status);

    Optional<PcEvento> findByPcIdAndEventoId(UUID pcId, UUID eventoId);

    boolean existsByPcIdAndEventoId(UUID pcId, UUID eventoId);
}
