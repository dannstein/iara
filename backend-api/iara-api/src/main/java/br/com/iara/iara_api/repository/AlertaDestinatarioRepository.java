package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AlertaDestinatario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertaDestinatarioRepository extends JpaRepository<AlertaDestinatario, UUID> {

    Optional<AlertaDestinatario> findByAlertaIdAndUsuarioId(UUID alertaId, UUID usuarioId);

    List<AlertaDestinatario> findByAlertaIdOrderBySentAtAsc(UUID alertaId);

    @Query("""
            select d from AlertaDestinatario d
            where d.alerta.id = :alertaId
              and (:status is null or d.deliveryStatus = :status)
            order by d.sentAt asc
            """)
    List<AlertaDestinatario> filtrarPorAlerta(@Param("alertaId") UUID alertaId,
                                              @Param("status") String status);

    /** Sumário de contagens por status para um alerta. Retorna List<Object[]> com 1 linha. */
    @Query(value = """
            select
              count(*) filter (where delivery_status = 'SENT')         as sent,
              count(*) filter (where delivery_status = 'DELIVERED')    as delivered,
              count(*) filter (where delivery_status = 'VISUALIZED')   as visualized,
              count(*) filter (where delivery_status = 'ACKNOWLEDGED') as acknowledged,
              count(*) filter (where response = 'ACCEPT')              as accepted,
              count(*) filter (where response = 'REFUSE')              as refused,
              count(*) filter (where response = 'UNAVAILABLE')         as unavailable,
              count(*) filter (where delivery_status = 'FAILED')       as failed
            from iara_alerta_destinatario
            where id_alerta = :alertaId
            """, nativeQuery = true)
    List<Object[]> ackSummary(@Param("alertaId") UUID alertaId);

    long countByAlertaIdAndResponse(UUID alertaId, String response);

    /** Total de alertas ativos com ack requerido onde o destinatário-alvo ainda não acked. */
    @Query(value = """
            select count(distinct d.id_alerta)
            from iara_alerta_destinatario d
            join iara_alerta a on a.id = d.id_alerta
            where a.status = 'ACTIVE' and a.requer_ack = true
              and d.acknowledged_at is null
              and a.id_tenant in (:tenantIds)
            """, nativeQuery = true)
    long countAcksPendentes(@Param("tenantIds") List<UUID> tenantIds);
}
