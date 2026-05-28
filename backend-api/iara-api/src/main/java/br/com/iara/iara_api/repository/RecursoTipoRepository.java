package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.RecursoTipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RecursoTipoRepository extends JpaRepository<RecursoTipo, UUID> {
}
