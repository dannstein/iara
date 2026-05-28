package br.com.iara.iara_api.messaging;

import br.com.iara.iara_api.config.RabbitConfig;
import br.com.iara.iara_api.domain.Notificacao;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.repository.NotificacaoRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final NotificacaoRepository notificacaoRepository;
    private final UsuarioRepository usuarioRepository;

    @RabbitListener(queues = RabbitConfig.NOTIF_QUEUE)
    @Transactional
    public void onNotification(NotificationMessage msg) {
        Usuario usuario = usuarioRepository.findById(msg.usuarioId()).orElse(null);
        if (usuario == null) {
            return; // destinatário removido — descarta silenciosamente
        }
        Notificacao n = new Notificacao();
        n.setUsuario(usuario);
        n.setTitulo(msg.titulo());
        n.setMensagem(msg.mensagem());
        n.setTipo(msg.tipo());
        n.setIdRef(msg.refId());
        notificacaoRepository.save(n);
    }
}
