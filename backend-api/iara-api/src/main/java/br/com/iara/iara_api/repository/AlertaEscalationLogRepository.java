package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AlertaEscalationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertaEscalationLogRepository extends JpaRepository<AlertaEscalationLog, UUID> {

    List<AlertaEscalationLog> findByAlertaIdOrderByCreatedAtAsc(UUID alertaId);
}
