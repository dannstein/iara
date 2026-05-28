package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AlertaTipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AlertaTipoRepository extends JpaRepository<AlertaTipo, UUID> {
    Optional<AlertaTipo> findByTipoNome(String tipoNome);
}
