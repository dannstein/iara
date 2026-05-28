package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.pc.CreateDoacaoRequest;
import br.com.iara.iara_api.dto.pc.DoacaoDTO;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.messaging.NotificationPublisher;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DoacaoService {

    private final DoacaoIntencaoRepository doacaoRepository;
    private final PcRepository pcRepository;
    private final PcDemandaRepository demandaRepository;
    private final PcEstoqueRepository estoqueRepository;
    private final DemandaTipoRepository demandaTipoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PcService pcService;
    private final CurrentUser currentUser;
    private final NotificationPublisher notificationPublisher;

    @Transactional
    public DoacaoDTO criar(CreateDoacaoRequest req) {
        Usuario u = currentUser.require();
        Pc pc = pcRepository.findById(req.idPc())
                .orElseThrow(() -> new NotFoundException("Ponto de coleta não encontrado"));
        PcDemanda demanda = demandaRepository.findById(req.idDemanda())
                .orElseThrow(() -> new NotFoundException("Demanda não encontrada"));
        DemandaTipo tipo = demandaTipoRepository.findById(req.idTipo())
                .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado"));

        DoacaoIntencao d = new DoacaoIntencao();
        d.setUsuario(u);
        d.setPc(pc);
        d.setDemanda(demanda);
        d.setTipo(tipo);
        d.setQuantidade(req.quantidade());
        d.setDescricao(req.descricao());
        d.setDataPrevista(req.dataPrevista());
        d.setStatus("PENDENTE");
        return DoacaoDTO.from(doacaoRepository.save(d));
    }

    @Transactional(readOnly = true)
    public List<DoacaoDTO> minhas() {
        return doacaoRepository.findByUsuarioIdOrderByCreatedAtDesc(currentUser.id())
                .stream().map(DoacaoDTO::from).toList();
    }

    @Transactional
    public DoacaoDTO cancelar(UUID id) {
        DoacaoIntencao d = doacaoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Intenção de doação não encontrada"));
        if (!d.getUsuario().getId().equals(currentUser.id())) {
            throw new ForbiddenException("Só o doador pode cancelar a própria intenção");
        }
        if (!"PENDENTE".equals(d.getStatus())) {
            throw new BusinessException("Apenas intenções PENDENTES podem ser canceladas");
        }
        d.setStatus("CANCELADA");
        return DoacaoDTO.from(d);
    }

    @Transactional(readOnly = true)
    public List<DoacaoDTO> pendentesDoPc(UUID pcId) {
        pcService.buscarVisivel(pcId);
        return doacaoRepository.findByPcIdAndStatus(pcId, "PENDENTE").stream().map(DoacaoDTO::from).toList();
    }

    /** RN18 — confirmação de recebimento físico com cascata de atualizações. */
    @Transactional
    public DoacaoDTO confirmar(UUID id, UUID idUsuConfirmou) {
        DoacaoIntencao d = doacaoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Intenção de doação não encontrada"));
        pcService.buscarVisivel(d.getPc().getId());
        if (!"PENDENTE".equals(d.getStatus())) {
            throw new BusinessException("Apenas intenções PENDENTES podem ser confirmadas");
        }

        // 1. status
        d.setStatus("CONFIRMADA");
        d.setDataConfirmacao(OffsetDateTime.now());
        if (idUsuConfirmou != null) {
            usuarioRepository.findById(idUsuConfirmou).ifPresent(d::setConfirmadoPor);
        } else {
            d.setConfirmadoPor(currentUser.require());
        }

        // 2. demanda.qtd_atendida += quantidade (limitado ao solicitado)
        PcDemanda demanda = d.getDemanda();
        int novoAtendido = Math.min(demanda.getQtdSolicitada(), demanda.getQtdAtendida() + d.getQuantidade());
        demanda.setQtdAtendida(novoAtendido);

        // 3. estoque += quantidade (upsert)
        PcEstoque est = estoqueRepository.findByPcIdAndTipoId(d.getPc().getId(), d.getTipo().getId())
                .orElseGet(() -> {
                    PcEstoque novo = new PcEstoque();
                    novo.setPc(d.getPc());
                    novo.setTipo(d.getTipo());
                    return novo;
                });
        est.setQuantidade(est.getQuantidade() + d.getQuantidade());
        estoqueRepository.save(est);

        // 4. copia pdr_referencia do evento da demanda (auditoria CGU/TCU)
        d.setPdrReferencia(demanda.getEvento().getPdrReferencia());

        // 5. notifica o doador (atualização em tempo real)
        notificationPublisher.notify(d.getUsuario().getId(), "Doação confirmada",
                "Sua doação foi recebida no ponto de coleta. Obrigado!", "PC", d.getPc().getId());

        return DoacaoDTO.from(d);
    }

    /** Expira intenções PENDENTES vencidas. */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void expirarPendentes() {
        doacaoRepository.findByStatusAndDataPrevistaBefore("PENDENTE", OffsetDateTime.now())
                .forEach(d -> d.setStatus("EXPIRADA"));
    }
}
