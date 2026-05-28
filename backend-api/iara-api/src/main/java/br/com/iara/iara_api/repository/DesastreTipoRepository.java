package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.DesastreTipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DesastreTipoRepository extends JpaRepository<DesastreTipo, UUID> {
}
