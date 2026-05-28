package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.DoacaoIntencao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DoacaoIntencaoRepository extends JpaRepository<DoacaoIntencao, UUID> {

    List<DoacaoIntencao> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);

    List<DoacaoIntencao> findByPcIdAndStatus(UUID pcId, String status);

    List<DoacaoIntencao> findByStatusAndDataPrevistaBefore(String status, java.time.OffsetDateTime limite);

    List<DoacaoIntencao> findByUsuarioIdAndDataSincronizacaoIsNull(UUID usuarioId);
}
