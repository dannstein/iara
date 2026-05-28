package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Checkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckinRepository extends JpaRepository<Checkin, UUID> {

    List<Checkin> findByEventoIdAndDataCheckoutIsNull(UUID eventoId);

    Optional<Checkin> findFirstByEventoIdAndUsuarioIdAndDataCheckoutIsNullOrderByDataCheckinDesc(
            UUID eventoId, UUID usuarioId);

    List<Checkin> findByUsuarioIdAndDataSincronizacaoIsNull(UUID usuarioId);

    List<Checkin> findByUsuarioIdOrderByDataCheckinDesc(UUID usuarioId);
}
