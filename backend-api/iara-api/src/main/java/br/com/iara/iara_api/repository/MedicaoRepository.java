package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Medicao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MedicaoRepository extends JpaRepository<Medicao, UUID> {

    Page<Medicao> findByEstacaoIdOrderByDataMedicaoDesc(UUID estacaoId, Pageable pageable);

    Optional<Medicao> findFirstByEstacaoIdOrderByDataMedicaoDesc(UUID estacaoId);
}
