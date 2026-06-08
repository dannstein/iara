package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.WorkerEventoDisponibilidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkerEventoDisponibilidadeRepository
        extends JpaRepository<WorkerEventoDisponibilidade, UUID> {

    /** Fila do worker autenticado. */
    List<WorkerEventoDisponibilidade> findByUsuarioIdAndStatusOrderByDataSolicitacaoDesc(
            UUID usuarioId, String status);

    /** Linhas de um PcEvento (workforce do coordenador). */
    List<WorkerEventoDisponibilidade> findByPcEventoIdOrderByDataSolicitacaoDesc(UUID pcEventoId);

    Optional<WorkerEventoDisponibilidade> findByPcEventoIdAndUsuarioId(
            UUID pcEventoId, UUID usuarioId);

    boolean existsByPcEventoIdAndUsuarioId(UUID pcEventoId, UUID usuarioId);
}
