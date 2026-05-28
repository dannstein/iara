package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PontoApoio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PontoApoioRepository extends JpaRepository<PontoApoio, UUID> {
}
