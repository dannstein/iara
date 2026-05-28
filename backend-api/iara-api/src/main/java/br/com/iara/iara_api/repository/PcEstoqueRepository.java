package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PcEstoque;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PcEstoqueRepository extends JpaRepository<PcEstoque, UUID> {

    List<PcEstoque> findByPcId(UUID pcId);

    Optional<PcEstoque> findByPcIdAndTipoId(UUID pcId, UUID tipoId);
}
