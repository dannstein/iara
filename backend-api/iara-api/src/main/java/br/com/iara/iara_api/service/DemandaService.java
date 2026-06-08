package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.pc.CapacidadeDTO;
import br.com.iara.iara_api.dto.pc.DemandaDTO;
import br.com.iara.iara_api.dto.pc.DemandaRequest;
import br.com.iara.iara_api.dto.pc.UpdateDemandaRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DemandaService {

    private final PcDemandaRepository demandaRepository;
    private final PcEventoRepository pcEventoRepository;
    private final EventoRepository eventoRepository;
    private final DemandaTipoRepository demandaTipoRepository;
    private final PcCapacidadeRepository capacidadeRepository;
    private final HelperRepository helperRepository;
    private final br.com.iara.iara_api.service.outbox.OutboxPublisher outbox;
    private final PcService pcService;
    private final CurrentUser currentUser;

    @Transactional
    public DemandaDTO criar(UUID pcId, DemandaRequest req) {
        Pc pc = pcService.buscarVisivel(pcId);
        exigirCoordOuWorker(pc);
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

        // Capacidade: explícita no request > default em PcCapacidade > sem limite.
        Integer cap = req.qtdMaximaCapacidade();
        if (cap == null) {
            cap = capacidadeRepository.findByPcIdAndTipoId(pcId, req.idTipo())
                    .map(PcCapacidade::getQtdMaxima)
                    .orElse(null);
        }
        if (cap != null && req.qtdSolicitada() > cap) {
            throw new BusinessException("qtdSolicitada (" + req.qtdSolicitada()
                    + ") excede capacidade máxima do PC para este tipo (" + cap + ")");
        }

        PcDemanda d = new PcDemanda();
        d.setPc(pc);
        d.setEvento(evento);
        d.setTipo(tipo);
        if (req.prioridade() != null) {
            d.setPrioridade(req.prioridade());
        }
        d.setQtdSolicitada(req.qtdSolicitada());
        d.setQtdMaximaCapacidade(cap);
        d.setStatus("OPEN");
        d.setDescricao(req.descricao());
        d.setCadastradoPor(currentUser.require());
        PcDemanda saved = demandaRepository.save(d);
        outbox.publish("SolicitacaoCriada", "PcDemanda", saved.getId(), "pc.solicitacao.criada",
                java.util.Map.of(
                        "demandaId", saved.getId().toString(),
                        "pcId", pcId.toString(),
                        "eventoId", evento.getId().toString(),
                        "tipoId", tipo.getId().toString(),
                        "qtdSolicitada", saved.getQtdSolicitada(),
                        "prioridade", saved.getPrioridade()
                ));
        return DemandaDTO.from(saved);
    }

    /**
     * Fecha manualmente uma demanda. Sub-fase 4C: coordenador OU worker do PC
     * (validação delegada ao service — Spring Security já garantiu auth).
     */
    @Transactional
    public DemandaDTO fechar(UUID pcId, UUID demandaId) {
        PcDemanda d = buscar(pcId, demandaId);
        exigirCoordOuWorker(d.getPc());
        if ("CLOSED".equals(d.getStatus())) {
            throw new BusinessException("Demanda já está fechada");
        }
        d.setStatus("CLOSED");
        d.setActive(false);
        d.setDataFechamento(OffsetDateTime.now());
        d.setFechadoPor(currentUser.require());
        outbox.publish("SolicitacaoFechada", "PcDemanda", d.getId(), "pc.solicitacao.fechada",
                java.util.Map.of(
                        "demandaId", d.getId().toString(),
                        "pcId", d.getPc().getId().toString(),
                        "eventoId", d.getEvento().getId().toString()
                ));
        return DemandaDTO.from(d);
    }

    /**
     * Recalcula o status da demanda com base em qtdRecebida vs qtdSolicitada.
     * Chamada pelo {@code DoacaoIntencaoService} (sub-fase 4D) após cada operação
     * de inventário. Permanece package-private por design.
     */
    @Transactional
    public void atualizarStatusAutomatico(PcDemanda d) {
        if ("CLOSED".equals(d.getStatus())) return;
        if (d.getQtdRecebida() >= d.getQtdSolicitada()) {
            d.setStatus("FULFILLED");
            d.setActive(false);
        } else if (d.getQtdRecebida() > 0) {
            d.setStatus("PARTIALLY_FULFILLED");
        } else {
            d.setStatus("OPEN");
        }
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
        exigirCoordOuWorker(d.getPc());
        if (req.prioridade() != null) {
            d.setPrioridade(req.prioridade());
        }
        if (req.qtdSolicitada() != null) {
            d.setQtdSolicitada(req.qtdSolicitada());
            atualizarStatusAutomatico(d);
        }
        if (req.descricao() != null) {
            d.setDescricao(req.descricao());
        }
        d.setAlteradoPor(currentUser.require());
        return DemandaDTO.from(d);
    }

    @Transactional
    public DemandaDTO desativar(UUID pcId, UUID demandaId) {
        // Alias semântico de fechar(): mantém compat com endpoint legado.
        return fechar(pcId, demandaId);
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

    /**
     * Fase 4C — autoriza coordenador OU worker (Helper CONFIRMADO+ativo) do PC.
     * Os endpoints relaxaram @PreAuthorize para auth qualquer; este método é a
     * última linha de defesa.
     */
    void exigirCoordOuWorker(Pc pc) {
        Usuario u = currentUser.require();
        if (pc.getCoordenador().getId().equals(u.getId())) return;
        boolean isWorker = helperRepository.listarPorPc(pc.getId(), "CONFIRMADO").stream()
                .anyMatch(h -> h.isActive() && h.getUsuario().getId().equals(u.getId()));
        if (!isWorker) {
            throw new br.com.iara.iara_api.exception.ForbiddenException(
                    "Apenas coordenador ou worker confirmado do PC pode executar essa ação");
        }
    }

    // -------------------------------------------------------------- capacidade

    @Transactional(readOnly = true)
    public List<CapacidadeDTO> listarCapacidades(UUID pcId) {
        Pc pc = pcService.buscarVisivel(pcId);
        return capacidadeRepository.findByPcId(pc.getId()).stream()
                .map(CapacidadeDTO::from).toList();
    }

    @Transactional
    public CapacidadeDTO upsertCapacidade(UUID pcId, UUID tipoId, int qtdMaxima) {
        Pc pc = pcService.buscarVisivel(pcId);
        exigirCoordOuWorker(pc);
        if (qtdMaxima <= 0) {
            throw new BusinessException("qtdMaxima deve ser > 0");
        }
        PcCapacidade cap = capacidadeRepository.findByPcIdAndTipoId(pcId, tipoId).orElseGet(() -> {
            PcCapacidade c = new PcCapacidade();
            c.setPc(pc);
            c.setTipo(demandaTipoRepository.findById(tipoId)
                    .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado")));
            return c;
        });
        cap.setQtdMaxima(qtdMaxima);
        cap.setAlteradoPor(currentUser.require());
        return CapacidadeDTO.from(capacidadeRepository.save(cap));
    }
}
