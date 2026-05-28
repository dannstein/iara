package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AtencaoApoio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AtencaoApoioRepository extends JpaRepository<AtencaoApoio, UUID> {

    List<AtencaoApoio> findByPontoAtencaoId(UUID pontoAtencaoId);

    long countByPontoAtencaoId(UUID pontoAtencaoId);
}
