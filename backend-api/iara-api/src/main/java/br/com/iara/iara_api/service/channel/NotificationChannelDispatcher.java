package br.com.iara.iara_api.service.channel;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.NotificacaoEnvio;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.repository.NotificacaoEnvioRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import br.com.iara.iara_api.service.AppConfigService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Executa o fan-out de notificação para todos os canais habilitados globalmente
 * (config {@code CANAIS_HABILITADOS}). Persiste uma linha em {@code iara_notificacao_envio}
 * por canal/destinatário com status do envio (ENVIADO/FALHOU/IGNORADO).
 *
 * Chamado pelo {@link br.com.iara.iara_api.service.alert.AlertaDispatcher}
 * APÓS o commit do alerta, na mesma callback que dispara push WebSocket e RabbitMQ.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationChannelDispatcher {

    private final List<INotificationChannel> channels;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoEnvioRepository envioRepository;
    private final AppConfigService appConfigService;

    private final Map<String, INotificationChannel> byId = new HashMap<>();

    @PostConstruct
    void index() {
        for (INotificationChannel c : channels) byId.put(c.id(), c);
        log.info("[NotificationChannelDispatcher] canais registrados: {}", byId.keySet());
    }

    @Transactional
    public void dispatch(Alerta alerta, Set<UUID> destinatarios) {
        if (destinatarios.isEmpty()) return;
        List<String> habilitados = appConfigService.canaisHabilitados();
        List<NotificacaoEnvio> rows = new ArrayList<>();

        for (String channelId : habilitados) {
            INotificationChannel channel = byId.get(channelId);
            if (channel == null) {
                log.warn("[NotificationChannelDispatcher] canal habilitado '{}' não está registrado", channelId);
                continue;
            }
            for (UUID userId : destinatarios) {
                Usuario u = usuarioRepository.findById(userId).orElse(null);
                if (u == null) continue;
                INotificationChannel.NotificationResult r;
                try {
                    r = channel.send(alerta, u);
                } catch (Exception e) {
                    r = INotificationChannel.NotificationResult.failed(e.getMessage());
                }
                NotificacaoEnvio envio = new NotificacaoEnvio();
                envio.setAlertaId(alerta.getId());
                envio.setUsuarioId(userId);
                envio.setCanal(channelId);
                envio.setStatus(r.status());
                envio.setErro(r.erro());
                rows.add(envio);
            }
        }
        if (!rows.isEmpty()) envioRepository.saveAll(rows);
    }
}
