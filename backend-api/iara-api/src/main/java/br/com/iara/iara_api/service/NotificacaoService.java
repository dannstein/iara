package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Notificacao;
import br.com.iara.iara_api.dto.notificacao.NotificacaoDTO;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.NotificacaoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository repository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<NotificacaoDTO> listar() {
        return repository.findByUsuarioIdOrderByLidaAscCreatedAtDesc(currentUser.id())
                .stream().map(NotificacaoDTO::from).toList();
    }

    @Transactional
    public NotificacaoDTO marcarLida(UUID id) {
        Notificacao n = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notificação não encontrada"));
        if (!n.getUsuario().getId().equals(currentUser.id())) {
            throw new ForbiddenException("Notificação de outro usuário");
        }
        n.setLida(true);
        return NotificacaoDTO.from(n);
    }

    @Transactional
    public int marcarTodasLidas() {
        return repository.marcarTodasComoLidas(currentUser.id());
    }

    @Transactional(readOnly = true)
    public long naoLidas() {
        return repository.countByUsuarioIdAndLidaFalse(currentUser.id());
    }
}
