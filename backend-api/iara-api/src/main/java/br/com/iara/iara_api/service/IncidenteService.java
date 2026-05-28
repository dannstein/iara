package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.Incidentes;
import br.com.iara.iara_api.dto.evento.IncidentesDTO;
import br.com.iara.iara_api.dto.evento.IncidentesRequest;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.IncidentesRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncidenteService {

    private final IncidentesRepository incidentesRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    /** Cada POST cria um novo registro (histórico append-only). */
    @Transactional
    public IncidentesDTO registrar(UUID eventoId, IncidentesRequest req) {
        Evento e = eventoService.buscarVisivel(eventoId);
        Incidentes i = new Incidentes();
        i.setEvento(e);
        i.setCadastradoPor(currentUser.require());
        i.setMortos(nz(req.mortos()));
        i.setFeridos(nz(req.feridos()));
        i.setDesabrigados(nz(req.desabrigados()));
        i.setDesaparecidos(nz(req.desaparecidos()));
        i.setStartVermelho(nz(req.startVermelho()));
        i.setStartAmarelo(nz(req.startAmarelo()));
        i.setStartVerde(nz(req.startVerde()));
        i.setStartPreto(nz(req.startPreto()));
        return IncidentesDTO.from(incidentesRepository.save(i));
    }

    @Transactional(readOnly = true)
    public List<IncidentesDTO> historico(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return incidentesRepository.findByEventoIdOrderByCreatedAtDesc(eventoId).stream()
                .map(IncidentesDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public IncidentesDTO atual(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return incidentesRepository.findFirstByEventoIdOrderByCreatedAtDesc(eventoId)
                .map(IncidentesDTO::from)
                .orElseThrow(() -> new NotFoundException("Nenhum registro de incidentes para o evento"));
    }

    private int nz(Integer v) {
        return v != null ? v : 0;
    }
}
