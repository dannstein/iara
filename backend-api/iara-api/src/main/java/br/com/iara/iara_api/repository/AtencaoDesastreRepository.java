package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AtencaoDesastre;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtencaoDesastreRepository extends JpaRepository<AtencaoDesastre, UUID> {

    List<AtencaoDesastre> findByPontoAtencaoId(UUID pontoAtencaoId);

    boolean existsByPontoAtencaoIdAndDesastreTipoId(UUID pontoAtencaoId, UUID desastreTipoId);
}
