package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.SolicitacaoApoio;
import br.com.iara.iara_api.dto.evento.ApoioDTO;
import br.com.iara.iara_api.dto.evento.ApoioRequest;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.SolicitacaoApoioRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApoioService {

    private final SolicitacaoApoioRepository apoioRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    @Transactional
    public ApoioDTO abrir(UUID eventoId, ApoioRequest req) {
        Evento e = eventoService.buscarVisivel(eventoId);
        SolicitacaoApoio s = new SolicitacaoApoio();
        s.setEvento(e);
        s.setOrigem(currentUser.require());
        s.setDescricao(req.descricao());
        s.setStatus("ABERTA");
        return ApoioDTO.from(apoioRepository.save(s));
    }

    @Transactional(readOnly = true)
    public List<ApoioDTO> listar(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return apoioRepository.findByEventoIdOrderByCreatedAtDesc(eventoId).stream()
                .map(ApoioDTO::from).toList();
    }

    @Transactional
    public ApoioDTO assumir(UUID eventoId, UUID apoioId) {
        SolicitacaoApoio s = buscar(eventoId, apoioId);
        s.setStatus("EM_ATENDIMENTO");
        s.setResponsavel(currentUser.require());
        return ApoioDTO.from(s);
    }

    @Transactional
    public ApoioDTO encerrar(UUID eventoId, UUID apoioId) {
        SolicitacaoApoio s = buscar(eventoId, apoioId);
        s.setStatus("ENCERRADA");
        return ApoioDTO.from(s);
    }

    private SolicitacaoApoio buscar(UUID eventoId, UUID apoioId) {
        eventoService.buscarVisivel(eventoId);
        SolicitacaoApoio s = apoioRepository.findById(apoioId)
                .orElseThrow(() -> new NotFoundException("Solicitação de apoio não encontrada"));
        if (!s.getEvento().getId().equals(eventoId)) {
            throw new NotFoundException("Solicitação não pertence a este evento");
        }
        return s;
    }
}
