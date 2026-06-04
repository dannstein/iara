package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppConfigRepository extends JpaRepository<AppConfig, String> {
}
