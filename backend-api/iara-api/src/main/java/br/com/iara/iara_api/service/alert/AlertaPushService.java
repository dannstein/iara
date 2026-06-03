package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Empurra eventos de alerta para clientes conectados via STOMP (Fase 3B).
 *
 * Dois tipos de mensagem:
 *  - Broadcast tenant: /topic/tenant/{tenantId}/alertas
 *  - Direct user:      /user/{email}/queue/alertas (resolvido pelo Spring)
 *
 * Os clientes só precisam invalidar caches (React Query) ou atualizar listas
 * locais — o payload é compacto (id + categoria + severidade), não o alerta
 * completo. Isso reduz tráfego e força um GET autenticado para detalhes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlertaPushService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UsuarioRepository usuarioRepository;

    /** Notifica todos os clientes do tenant + cada destinatário individualmente. */
    public void pushNew(Alerta alerta, List<UUID> destinatarios) {
        Map<String, Object> payload = Map.of(
                "type", "ALERT_NEW",
                "id", alerta.getId().toString(),
                "categoria", alerta.getCategoria(),
                "severidade", alerta.getSeveridade(),
                "tenantId", alerta.getTenant().getId().toString()
        );
        String tenantTopic = "/topic/tenant/" + alerta.getTenant().getId() + "/alertas";
        messagingTemplate.convertAndSend(tenantTopic, (Object) payload);

        for (UUID userId : destinatarios) {
            usuarioRepository.findById(userId).ifPresent(u ->
                    messagingTemplate.convertAndSendToUser(
                            u.getEmail(), "/queue/alertas", (Object) payload));
        }
        log.debug("[AlertaPushService] tenantTopic={} destinatarios={}", tenantTopic, destinatarios.size());
    }

    /** Notifica que um alerta mudou de status (resolved/cancelled/expired). */
    public void pushStatusChange(Alerta alerta) {
        Map<String, Object> payload = Map.of(
                "type", "ALERT_STATUS_CHANGED",
                "id", alerta.getId().toString(),
                "status", alerta.getStatus(),
                "tenantId", alerta.getTenant().getId().toString()
        );
        String tenantTopic = "/topic/tenant/" + alerta.getTenant().getId() + "/alertas";
        messagingTemplate.convertAndSend(tenantTopic, (Object) payload);
    }
}
