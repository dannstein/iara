package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PcCapacidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PcCapacidadeRepository
        extends JpaRepository<PcCapacidade, PcCapacidade.Key> {

    Optional<PcCapacidade> findByPcIdAndTipoId(UUID pcId, UUID tipoId);

    List<PcCapacidade> findByPcId(UUID pcId);
}
