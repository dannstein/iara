package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.NotificacaoEnvio;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NotificacaoEnvioRepository extends JpaRepository<NotificacaoEnvio, UUID> {

    Page<NotificacaoEnvio> findByCanalOrderBySentAtDesc(String canal, Pageable pageable);

    Page<NotificacaoEnvio> findByAlertaIdOrderBySentAtDesc(UUID alertaId, Pageable pageable);
}
