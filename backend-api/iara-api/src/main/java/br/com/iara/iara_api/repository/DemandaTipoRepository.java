package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.DemandaTipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DemandaTipoRepository extends JpaRepository<DemandaTipo, UUID> {
}
