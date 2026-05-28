package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.SetorOperacao;
import br.com.iara.iara_api.dto.evento.SetorDTO;
import br.com.iara.iara_api.dto.evento.SetorRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.SetorOperacaoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SetorService {

    private static final Set<String> TIPOS = Set.of("QUENTE", "MORNA", "FRIA");

    private final SetorOperacaoRepository setorRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    @Transactional
    public SetorDTO definir(UUID eventoId, SetorRequest req) {
        if (!TIPOS.contains(req.tipo())) {
            throw new BusinessException("Tipo de setor inválido. Use QUENTE, MORNA ou FRIA");
        }
        Evento e = eventoService.buscarVisivel(eventoId);
        SetorOperacao s = setorRepository.findByEventoIdAndTipo(eventoId, req.tipo())
                .orElseGet(() -> {
                    SetorOperacao novo = new SetorOperacao();
                    novo.setEvento(e);
                    novo.setTipo(req.tipo());
                    novo.setDefinidoPor(currentUser.require());
                    return novo;
                });
        s.setGeometria(GeoUtil.fromGeoJson(req.geometria()));
        s.setDescricao(req.descricao());
        return SetorDTO.from(setorRepository.save(s));
    }

    @Transactional(readOnly = true)
    public List<SetorDTO> listar(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return setorRepository.findByEventoId(eventoId).stream().map(SetorDTO::from).toList();
    }

    @Transactional
    public SetorDTO atualizar(UUID eventoId, String tipo, SetorRequest req) {
        eventoService.buscarVisivel(eventoId);
        SetorOperacao s = setorRepository.findByEventoIdAndTipo(eventoId, tipo)
                .orElseThrow(() -> new NotFoundException("Setor não encontrado"));
        s.setGeometria(GeoUtil.fromGeoJson(req.geometria()));
        s.setDescricao(req.descricao());
        return SetorDTO.from(s);
    }

    @Transactional
    public void remover(UUID eventoId, String tipo) {
        eventoService.buscarVisivel(eventoId);
        SetorOperacao s = setorRepository.findByEventoIdAndTipo(eventoId, tipo)
                .orElseThrow(() -> new NotFoundException("Setor não encontrado"));
        setorRepository.delete(s);
    }

    @Transactional(readOnly = true)
    public Map<String, String> verificar(UUID eventoId, double lat, double lng) {
        eventoService.buscarVisivel(eventoId);
        return setorRepository.setorDaCoordenada(eventoId, lat, lng)
                .map(s -> Map.of("setor", s.getTipo()))
                .orElseGet(() -> {
                    Map<String, String> m = new java.util.HashMap<>();
                    m.put("setor", null);
                    return m;
                });
    }
}
