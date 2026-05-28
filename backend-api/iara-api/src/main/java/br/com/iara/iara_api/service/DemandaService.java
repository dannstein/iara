package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.pc.DemandaDTO;
import br.com.iara.iara_api.dto.pc.DemandaRequest;
import br.com.iara.iara_api.dto.pc.UpdateDemandaRequest;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DemandaService {

    private final PcDemandaRepository demandaRepository;
    private final PcEventoRepository pcEventoRepository;
    private final EventoRepository eventoRepository;
    private final DemandaTipoRepository demandaTipoRepository;
    private final PcService pcService;
    private final CurrentUser currentUser;

    @Transactional
    public DemandaDTO criar(UUID pcId, DemandaRequest req) {
        Pc pc = pcService.buscarVisivel(pcId);
        // Pré-condição RF09: vínculo PC↔evento deve estar ACEITO
        PcEvento pe = pcEventoRepository.findByPcIdAndEventoId(pcId, req.idEvento())
                .orElseThrow(() -> new ConflictException(
                        "PC não está vinculado a este evento — vínculo ACEITO necessário"));
        if (!"ACEITO".equals(pe.getStatus())) {
            throw new ConflictException("Vínculo PC↔evento precisa estar ACEITO para criar demandas");
        }
        Evento evento = eventoRepository.findById(req.idEvento())
                .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
        DemandaTipo tipo = demandaTipoRepository.findById(req.idTipo())
                .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado"));

        PcDemanda d = new PcDemanda();
        d.setPc(pc);
        d.setEvento(evento);
        d.setTipo(tipo);
        if (req.prioridade() != null) {
            d.setPrioridade(req.prioridade());
        }
        d.setQtdSolicitada(req.qtdSolicitada());
        d.setDescricao(req.descricao());
        d.setCadastradoPor(currentUser.require());
        return DemandaDTO.from(demandaRepository.save(d));
    }

    @Transactional(readOnly = true)
    public List<DemandaDTO> listar(UUID pcId, Boolean isActive, String prioridade, UUID eventoId) {
        pcService.buscarVisivel(pcId);
        return demandaRepository.listarPorPc(pcId, isActive, prioridade, eventoId)
                .stream().map(DemandaDTO::from).toList();
    }

    @Transactional
    public DemandaDTO atualizar(UUID pcId, UUID demandaId, UpdateDemandaRequest req) {
        PcDemanda d = buscar(pcId, demandaId);
        if (req.prioridade() != null) {
            d.setPrioridade(req.prioridade());
        }
        if (req.qtdSolicitada() != null) {
            d.setQtdSolicitada(req.qtdSolicitada());
        }
        if (req.descricao() != null) {
            d.setDescricao(req.descricao());
        }
        d.setAlteradoPor(currentUser.require());
        return DemandaDTO.from(d);
    }

    @Transactional
    public DemandaDTO desativar(UUID pcId, UUID demandaId) {
        PcDemanda d = buscar(pcId, demandaId);
        d.setActive(false);
        return DemandaDTO.from(d);
    }

    @Transactional(readOnly = true)
    public List<DemandaDTO> mural(UUID eventoId) {
        return demandaRepository.mural(eventoId).stream().map(DemandaDTO::from).toList();
    }

    private PcDemanda buscar(UUID pcId, UUID demandaId) {
        pcService.buscarVisivel(pcId);
        PcDemanda d = demandaRepository.findById(demandaId)
                .orElseThrow(() -> new NotFoundException("Demanda não encontrada"));
        if (!d.getPc().getId().equals(pcId)) {
            throw new NotFoundException("Demanda não pertence a este PC");
        }
        return d;
    }
}
