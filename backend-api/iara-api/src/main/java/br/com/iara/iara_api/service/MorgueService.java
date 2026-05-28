package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.Morgue;
import br.com.iara.iara_api.dto.evento.MorgueDTO;
import br.com.iara.iara_api.dto.evento.MorgueRequest;
import br.com.iara.iara_api.dto.evento.MorgueUpdateRequest;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.MorgueRepository;
import br.com.iara.iara_api.repository.VitimaTriagemRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MorgueService {

    private final MorgueRepository morgueRepository;
    private final VitimaTriagemRepository triagemRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    @Transactional
    public MorgueDTO registrar(UUID eventoId, MorgueRequest req) {
        Evento e = eventoService.buscarVisivel(eventoId);
        morgueRepository.findByEventoIdAndCodigoMorgue(eventoId, req.codigoMorgue()).ifPresent(m -> {
            throw new ConflictException("Código de óbito já registrado neste evento");
        });
        Morgue m = new Morgue();
        m.setEvento(e);
        m.setCodigoMorgue(req.codigoMorgue());
        m.setNomeIdentificado(req.nomeIdentificado());
        m.setDocumento(req.documento());
        m.setIdadeEstimada(req.idadeEstimada());
        m.setSexo(req.sexo());
        m.setLocalEncontrado(GeoUtil.point(req.localEncontrado()));
        m.setDescricaoLocal(req.descricaoLocal());
        m.setLocalRemocao(req.localRemocao());
        m.setRegistradoPor(currentUser.require());
        if (req.idTriagem() != null) {
            triagemRepository.findById(req.idTriagem()).ifPresent(m::setTriagem);
        }
        m.setDataSincronizacao(req.dataSincronizacao());
        return MorgueDTO.from(morgueRepository.save(m));
    }

    @Transactional(readOnly = true)
    public List<MorgueDTO> listar(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return morgueRepository.findByEventoIdOrderByCreatedAtDesc(eventoId).stream()
                .map(MorgueDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public MorgueDTO detalhar(UUID eventoId, String codigo) {
        eventoService.buscarVisivel(eventoId);
        return MorgueDTO.from(buscar(eventoId, codigo));
    }

    @Transactional
    public MorgueDTO atualizar(UUID eventoId, String codigo, MorgueUpdateRequest req) {
        eventoService.buscarVisivel(eventoId);
        Morgue m = buscar(eventoId, codigo);
        if (req.nomeIdentificado() != null) {
            m.setNomeIdentificado(req.nomeIdentificado());
        }
        if (req.documento() != null) {
            m.setDocumento(req.documento());
        }
        if (req.localRemocao() != null) {
            m.setLocalRemocao(req.localRemocao());
        }
        if (req.dataRemocao() != null) {
            m.setDataRemocao(req.dataRemocao());
            m.setRemovidoPor(currentUser.require());
        }
        return MorgueDTO.from(m);
    }

    private Morgue buscar(UUID eventoId, String codigo) {
        return morgueRepository.findByEventoIdAndCodigoMorgue(eventoId, codigo)
                .orElseThrow(() -> new NotFoundException("Registro de óbito não encontrado"));
    }
}
