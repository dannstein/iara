package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PcMotivoRecusa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PcMotivoRecusaRepository extends JpaRepository<PcMotivoRecusa, UUID> {

    List<PcMotivoRecusa> findByAtivoTrueOrderByLabel();
}
