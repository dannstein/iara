package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.pc.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Sub-fase 4B — orquestra o ciclo de disponibilidade do PC para um evento e
 * o fan-out de solicitações de disponibilidade para os workers.
 *
 * <p>O fan-out é feito inline (mesma transação do aceitar). A integração via
 * outbox + listener desacoplado entra na sub-fase 4E.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PcEventoLifecycleService {

    private final PcRepository pcRepository;
    private final PcEventoRepository pcEventoRepository;
    private final PcMotivoRecusaRepository motivoRecusaRepository;
    private final HelperRepository helperRepository;
    private final WorkerEventoDisponibilidadeRepository workerDispRepository;
    private final br.com.iara.iara_api.service.outbox.OutboxPublisher outbox;
    private final PcAuditService audit;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public List<MotivoRecusaDTO> listarMotivos() {
        return motivoRecusaRepository.findByAtivoTrueOrderByLabel()
                .stream().map(MotivoRecusaDTO::from).toList();
    }

    @Transactional
    public PcEventoDTO aceitar(UUID pcId, UUID eventoId) {
        Pc pc = buscarVisivel(pcId);
        Usuario actor = currentUser.require();
        if (!pc.getCoordenador().getId().equals(actor.getId())) {
            throw new ForbiddenException("Apenas o coordenador do PC pode responder ao evento");
        }
        PcEvento pe = pcEventoRepository.findByPcIdAndEventoId(pcId, eventoId)
                .orElseThrow(() -> new NotFoundException("Vínculo PC↔evento não encontrado"));
        if (!"NOTIFICADO".equals(pe.getStatus())) {
            throw new BusinessException("Vínculo PC↔evento já foi respondido (status=" + pe.getStatus() + ")");
        }
        pe.setStatus("ACEITO");
        pe.setDataResposta(OffsetDateTime.now());
        pe.setResponsavel(actor);
        pe.setMotivoRecusa(null);
        pe.setMotivoRecusaDescricao(null);

        // Fan-out síncrono: cria disponibilidade PENDENTE para cada worker confirmado/ativo.
        fanoutWorkers(pe);

        // Outbox 4E.
        outbox.publish("PcEventoAceito", "PcEvento", pe.getId(), "pc.evento.aceito",
                java.util.Map.of(
                        "pcId", pe.getPc().getId().toString(),
                        "eventoId", pe.getEvento().getId().toString(),
                        "responsavelId", actor.getId().toString()
                ));
        // Audit 4F.
        audit.log(pe.getPc().getId(), pe.getEvento().getId(), actor.getId(),
                PcAuditService.PC_AVAILABILITY_ACCEPTED,
                java.util.Map.of("pcEventoId", pe.getId().toString()));
        return PcEventoDTO.from(pe);
    }

    @Transactional
    public PcEventoDTO recusar(UUID pcId, UUID eventoId, RecusarPcEventoRequest req) {
        Pc pc = buscarVisivel(pcId);
        Usuario actor = currentUser.require();
        if (!pc.getCoordenador().getId().equals(actor.getId())) {
            throw new ForbiddenException("Apenas o coordenador do PC pode responder ao evento");
        }
        PcEvento pe = pcEventoRepository.findByPcIdAndEventoId(pcId, eventoId)
                .orElseThrow(() -> new NotFoundException("Vínculo PC↔evento não encontrado"));
        if (!"NOTIFICADO".equals(pe.getStatus())) {
            throw new BusinessException("Vínculo PC↔evento já foi respondido (status=" + pe.getStatus() + ")");
        }
        PcMotivoRecusa motivo = motivoRecusaRepository.findById(req.idMotivoRecusa())
                .orElseThrow(() -> new NotFoundException("Motivo de recusa não encontrado"));
        if (!motivo.isAtivo()) {
            throw new BusinessException("Motivo de recusa inativo");
        }
        if (motivo.isExigeDescricao() && (req.descricao() == null || req.descricao().isBlank())) {
            throw new BusinessException("Motivo '" + motivo.getCodigo() + "' exige descrição");
        }
        pe.setStatus("RECUSADO");
        pe.setDataResposta(OffsetDateTime.now());
        pe.setResponsavel(actor);
        pe.setMotivoRecusa(motivo);
        pe.setMotivoRecusaDescricao(req.descricao());
        outbox.publish("PcEventoRecusado", "PcEvento", pe.getId(), "pc.evento.recusado",
                java.util.Map.of(
                        "pcId", pe.getPc().getId().toString(),
                        "eventoId", pe.getEvento().getId().toString(),
                        "motivoCodigo", motivo.getCodigo()
                ));
        audit.log(pe.getPc().getId(), pe.getEvento().getId(), actor.getId(),
                PcAuditService.PC_AVAILABILITY_REFUSED,
                java.util.Map.of("motivoCodigo", motivo.getCodigo(),
                        "descricao", req.descricao() == null ? "" : req.descricao()));
        return PcEventoDTO.from(pe);
    }

    /** Workforce de um PC para um evento (visão do coordenador). */
    @Transactional(readOnly = true)
    public List<WorkerDisponibilidadeDTO> workforce(UUID pcId, UUID eventoId) {
        Pc pc = buscarVisivel(pcId);
        Usuario actor = currentUser.require();
        if (!pc.getCoordenador().getId().equals(actor.getId())
                && !tenantScope.canSee(actor, pc.getTenant().getId())) {
            throw new ForbiddenException("PC fora do seu escopo");
        }
        PcEvento pe = pcEventoRepository.findByPcIdAndEventoId(pcId, eventoId)
                .orElseThrow(() -> new NotFoundException("Vínculo PC↔evento não encontrado"));
        return workerDispRepository.findByPcEventoIdOrderByDataSolicitacaoDesc(pe.getId())
                .stream().map(WorkerDisponibilidadeDTO::from).toList();
    }

    /** Fila pessoal do worker (sub-fase 4B). */
    @Transactional(readOnly = true)
    public List<WorkerDisponibilidadeDTO> minhaFila(String status) {
        Usuario u = currentUser.require();
        String st = status == null || status.isBlank() ? "PENDENTE" : status;
        return workerDispRepository
                .findByUsuarioIdAndStatusOrderByDataSolicitacaoDesc(u.getId(), st)
                .stream().map(WorkerDisponibilidadeDTO::from).toList();
    }

    @Transactional
    public WorkerDisponibilidadeDTO confirmar(UUID id) {
        WorkerEventoDisponibilidade d = exigirPropria(id);
        if (!"PENDENTE".equals(d.getStatus())) {
            throw new BusinessException("Disponibilidade já respondida (" + d.getStatus() + ")");
        }
        d.setStatus("CONFIRMADA");
        d.setDataResposta(OffsetDateTime.now());
        d.setMotivoRecusa(null);
        d.setMotivoDescricao(null);
        outbox.publish("WorkerDisponibilidadeRespondida", "WorkerEventoDisponibilidade",
                d.getId(), "pc.worker.respondeu",
                java.util.Map.of(
                        "disponibilidadeId", d.getId().toString(),
                        "pcEventoId", d.getPcEvento().getId().toString(),
                        "usuarioId", d.getUsuario().getId().toString(),
                        "status", "CONFIRMADA"
                ));
        return WorkerDisponibilidadeDTO.from(d);
    }

    @Transactional
    public WorkerDisponibilidadeDTO recusarDisponibilidade(UUID id, ResponderDisponibilidadeRequest req) {
        WorkerEventoDisponibilidade d = exigirPropria(id);
        if (!"PENDENTE".equals(d.getStatus())) {
            throw new BusinessException("Disponibilidade já respondida (" + d.getStatus() + ")");
        }
        PcMotivoRecusa motivo = null;
        if (req != null && req.idMotivoRecusa() != null) {
            motivo = motivoRecusaRepository.findById(req.idMotivoRecusa())
                    .orElseThrow(() -> new NotFoundException("Motivo não encontrado"));
            if (motivo.isExigeDescricao() && (req.descricao() == null || req.descricao().isBlank())) {
                throw new BusinessException("Motivo '" + motivo.getCodigo() + "' exige descrição");
            }
        }
        d.setStatus("RECUSADA");
        d.setDataResposta(OffsetDateTime.now());
        java.util.Map<String, Object> payloadR = new java.util.HashMap<>();
        payloadR.put("disponibilidadeId", d.getId().toString());
        payloadR.put("pcEventoId", d.getPcEvento().getId().toString());
        payloadR.put("usuarioId", d.getUsuario().getId().toString());
        payloadR.put("status", "RECUSADA");
        payloadR.put("motivoCodigo", motivo != null ? motivo.getCodigo() : null);
        outbox.publish("WorkerDisponibilidadeRespondida", "WorkerEventoDisponibilidade",
                d.getId(), "pc.worker.respondeu", payloadR);
        d.setMotivoRecusa(motivo);
        d.setMotivoDescricao(req != null ? req.descricao() : null);
        return WorkerDisponibilidadeDTO.from(d);
    }

    // ---------- internals ----------

    private WorkerEventoDisponibilidade exigirPropria(UUID id) {
        Usuario u = currentUser.require();
        WorkerEventoDisponibilidade d = workerDispRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Disponibilidade não encontrada"));
        if (!d.getUsuario().getId().equals(u.getId())) {
            throw new ForbiddenException("Disponibilidade não pertence ao usuário autenticado");
        }
        return d;
    }

    private void fanoutWorkers(PcEvento pe) {
        List<Helper> workers = helperRepository.listarPorPc(pe.getPc().getId(), "CONFIRMADO");
        int created = 0;
        for (Helper h : workers) {
            if (!h.isActive()) continue;
            // UNIQUE(pc_evento, usuario) — só cria se ainda não houver.
            if (workerDispRepository.existsByPcEventoIdAndUsuarioId(pe.getId(), h.getUsuario().getId())) {
                continue;
            }
            WorkerEventoDisponibilidade d = new WorkerEventoDisponibilidade();
            d.setPcEvento(pe);
            d.setUsuario(h.getUsuario());
            d.setStatus("PENDENTE");
            d.setDataSolicitacao(OffsetDateTime.now());
            workerDispRepository.save(d);
            audit.log(pe.getPc().getId(), pe.getEvento().getId(), h.getUsuario().getId(),
                    PcAuditService.WORKER_AVAILABILITY_REQ,
                    java.util.Map.of("disponibilidadeId", d.getId().toString()));
            created++;
        }
        log.info("[PcEventoLifecycle] PC={} evento={} workforce solicitada para {} workers",
                pe.getPc().getId(), pe.getEvento().getId(), created);
    }

    private Pc buscarVisivel(UUID pcId) {
        Usuario u = currentUser.require();
        Pc pc = pcRepository.findById(pcId)
                .orElseThrow(() -> new NotFoundException("Ponto de coleta não encontrado"));
        if (!tenantScope.canSee(u, pc.getTenant().getId())) {
            throw new ForbiddenException("PC fora do seu escopo de tenant");
        }
        return pc;
    }
}
