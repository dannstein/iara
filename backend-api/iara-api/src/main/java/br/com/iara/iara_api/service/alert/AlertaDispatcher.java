package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.AlertaDestinatario;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.messaging.NotificationPublisher;
import br.com.iara.iara_api.repository.AlertaDestinatarioRepository;
import br.com.iara.iara_api.repository.AlertaRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Cria as linhas de iara_alerta_destinatario (status=SENT) em batch e enfileira
 * o fan-out via RabbitMQ. Atualiza total_destinatarios no Alerta.
 */
@Service
@RequiredArgsConstructor
public class AlertaDispatcher {

    private final AlertaRepository alertaRepository;
    private final AlertaDestinatarioRepository destinatarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificationPublisher publisher;

    @Transactional
    public int dispatch(Alerta alerta, Set<UUID> destinatarios) {
        if (destinatarios.isEmpty()) {
            alerta.setTotalDestinatarios(0);
            return 0;
        }
        OffsetDateTime now = OffsetDateTime.now();
        List<AlertaDestinatario> rows = new ArrayList<>(destinatarios.size());
        List<UUID> validIds = new ArrayList<>(destinatarios.size());

        for (UUID userId : destinatarios) {
            Usuario u = usuarioRepository.findById(userId).orElse(null);
            if (u == null) continue;
            AlertaDestinatario d = new AlertaDestinatario();
            d.setAlerta(alerta);
            d.setUsuario(u);
            d.setDeliveryStatus("SENT");
            d.setSentAt(now);
            rows.add(d);
            validIds.add(userId);
        }
        destinatarioRepository.saveAll(rows);

        alerta.setTotalDestinatarios(validIds.size());
        alertaRepository.save(alerta);

        // Publica em RabbitMQ APÓS o commit da transação, para evitar que o consumer
        // tente ler o Alerta antes de ele estar visível no banco.
        final UUID alertaId = alerta.getId();
        final String titulo = alerta.getTitulo() != null ? alerta.getTitulo() : alerta.getTipo().getTipoNome();
        final String mensagem = alerta.getMensagem();
        final String severidade = alerta.getSeveridade();
        final List<UUID> finalIds = List.copyOf(validIds);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publisher.dispatchAlert(alertaId, titulo, mensagem, severidade, finalIds);
                }
            });
        } else {
            publisher.dispatchAlert(alertaId, titulo, mensagem, severidade, finalIds);
        }
        return validIds.size();
    }
}
