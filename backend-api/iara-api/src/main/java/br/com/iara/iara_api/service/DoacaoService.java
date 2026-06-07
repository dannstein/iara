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
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Sub-fase 4D — ciclo de vida da intenção de doação + transações de inventário.
 *
 * <p>Toda mudança de inventário registra uma linha em {@link InventoryTransaction}
 * (tabela append-only — RULES no banco bloqueiam UPDATE/DELETE). Os contadores
 * de {@link PcDemanda} e {@link PcEstoque} derivam dessas transações.</p>
 *
 * <p>Reserva <strong>soft</strong>: {@code qtdIntencionada} na demanda conta o que
 * está reservado; intenções PENDENTE expiram em 48h via {@link #expirarIntencoes()}.</p>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DoacaoService {

    private static final Set<String> DEMANDA_ABERTA = Set.of("OPEN", "PARTIALLY_FULFILLED");

    private final DoacaoIntencaoRepository doacaoRepository;
    private final PcRepository pcRepository;
    private final PcDemandaRepository demandaRepository;
    private final PcEstoqueRepository estoqueRepository;
    private final DemandaTipoRepository demandaTipoRepository;
    private final InventoryTransactionRepository inventoryRepository;
    private final UsuarioRepository usuarioRepository;
    private final PcService pcService;
    private final DemandaService demandaService;
    private final br.com.iara.iara_api.service.outbox.OutboxPublisher outbox;
    private final CurrentUser currentUser;
    private final NotificationPublisher notificationPublisher;

    // ============================================================================
    // INTENÇÃO DO DOADOR
    // ============================================================================

    @Transactional
    public DoacaoDTO criar(CreateDoacaoRequest req) {
        Usuario u = currentUser.require();
        Pc pc = pcRepository.findById(req.idPc())
                .orElseThrow(() -> new NotFoundException("Ponto de coleta não encontrado"));
        PcDemanda demanda = demandaRepository.findById(req.idDemanda())
                .orElseThrow(() -> new NotFoundException("Demanda não encontrada"));
        DemandaTipo tipo = demandaTipoRepository.findById(req.idTipo())
                .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado"));

        if (!demanda.getPc().getId().equals(pc.getId())) {
            throw new BusinessException("Demanda não pertence a este PC");
        }
        if (!demanda.getTipo().getId().equals(tipo.getId())) {
            throw new BusinessException("Tipo informado não confere com o tipo da demanda");
        }
        if (!DEMANDA_ABERTA.contains(demanda.getStatus())) {
            throw new BusinessException(
                    "Demanda não está aceitando intenções (status=" + demanda.getStatus() + ")");
        }

        // Reserva soft — disponivel = solicitada - já recebida - já intencionada.
        int disponivel = demanda.getQtdSolicitada()
                - demanda.getQtdRecebida()
                - demanda.getQtdIntencionada();
        if (req.quantidade() > disponivel) {
            throw new BusinessException("Quantidade excede a disponibilidade reservável da demanda ("
                    + disponivel + " disponível)");
        }

        DoacaoIntencao d = new DoacaoIntencao();
        d.setUsuario(u);
        d.setPc(pc);
        d.setDemanda(demanda);
        d.setTipo(tipo);
        d.setQuantidade(req.quantidade());
        d.setDescricao(req.descricao());
        d.setDataPrevista(req.dataPrevista());
        d.setStatus("PENDENTE");
        d.setDataExpiracao(OffsetDateTime.now().plusHours(48));
        doacaoRepository.save(d);

        demanda.setQtdIntencionada(demanda.getQtdIntencionada() + req.quantidade());
        registrar("INTENT_CREATED", pc, demanda, tipo, req.quantidade(), d, u, null);
        outbox.publish("DoacaoIntencaoCriada", "DoacaoIntencao", d.getId(), "pc.doacao.intencao",
                java.util.Map.of(
                        "intencaoId", d.getId().toString(),
                        "pcId", pc.getId().toString(),
                        "demandaId", demanda.getId().toString(),
                        "usuarioId", u.getId().toString(),
                        "quantidade", req.quantidade()
                ));
        return DoacaoDTO.from(d);
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
        Usuario u = currentUser.require();
        boolean ehDono = d.getUsuario().getId().equals(u.getId());
        boolean ehCoord = d.getPc().getCoordenador().getId().equals(u.getId());
        if (!ehDono && !ehCoord) {
            throw new ForbiddenException("Apenas o doador ou o coordenador do PC podem cancelar a intenção");
        }
        if (!"PENDENTE".equals(d.getStatus())) {
            throw new BusinessException("Apenas intenções PENDENTES podem ser canceladas");
        }
        d.setStatus("CANCELADA");
        PcDemanda demanda = d.getDemanda();
        demanda.setQtdIntencionada(Math.max(0, demanda.getQtdIntencionada() - d.getQuantidade()));
        registrar("INTENT_CANCELLED", d.getPc(), demanda, d.getTipo(), d.getQuantidade(), d, u, null);
        return DoacaoDTO.from(d);
    }

    @Transactional(readOnly = true)
    public List<DoacaoDTO> pendentesDoPc(UUID pcId) {
        pcService.buscarVisivel(pcId);
        return doacaoRepository.findByPcIdAndStatus(pcId, "PENDENTE")
                .stream().map(DoacaoDTO::from).toList();
    }

    // ============================================================================
    // RECEBIMENTO / DISTRIBUIÇÃO (coordenador OU worker)
    // ============================================================================

    /**
     * Marca a intenção como recebida fisicamente. {@code qtdRecebida} pode ser
     * &lt;= {@code intencao.quantidade}. A diferença é liberada de volta na
     * {@code qtdIntencionada} da demanda. Atualiza estoque, demanda e cria
     * transação RECEIVED.
     */
    @Transactional
    public DoacaoDTO marcarRecebida(UUID id, int qtdRecebida) {
        DoacaoIntencao d = doacaoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Intenção não encontrada"));
        demandaService.exigirCoordOuWorker(d.getPc());
        if (!"PENDENTE".equals(d.getStatus())) {
            throw new BusinessException("Apenas intenções PENDENTES podem ser recebidas");
        }
        if (qtdRecebida <= 0 || qtdRecebida > d.getQuantidade()) {
            throw new BusinessException("qtdRecebida deve estar entre 1 e " + d.getQuantidade());
        }
        Usuario actor = currentUser.require();

        // 1. Intenção encerra.
        d.setStatus("CONFIRMADA");
        d.setQtdRecebida(qtdRecebida);
        d.setDataConfirmacao(OffsetDateTime.now());
        d.setConfirmadoPor(actor);

        // 2. Demanda: libera toda a intencionada da intenção, credita o recebido.
        PcDemanda demanda = d.getDemanda();
        demanda.setQtdIntencionada(Math.max(0, demanda.getQtdIntencionada() - d.getQuantidade()));
        demanda.setQtdRecebida(demanda.getQtdRecebida() + qtdRecebida);
        demanda.setQtdAtendida(Math.min(demanda.getQtdSolicitada(),
                demanda.getQtdAtendida() + qtdRecebida));
        demandaService.atualizarStatusAutomatico(demanda);

        // 3. Estoque (PcEstoque @Version).
        PcEstoque est = upsertEstoque(d.getPc(), d.getTipo());
        est.setQuantidade(est.getQuantidade() + qtdRecebida);
        est.setAlteradoPor(actor);

        // 4. Auditoria CGU.
        d.setPdrReferencia(demanda.getEvento().getPdrReferencia());

        // 5. Notificação acessória ao doador.
        notificationPublisher.notify(d.getUsuario().getId(), "Doação confirmada",
                "Sua doação foi recebida no ponto de coleta. Obrigado!", "PC", d.getPc().getId());

        registrar("RECEIVED", d.getPc(), demanda, d.getTipo(), qtdRecebida, d, actor, null);
        outbox.publish("DoacaoRecebida", "DoacaoIntencao", d.getId(), "pc.doacao.recebida",
                java.util.Map.of(
                        "intencaoId", d.getId().toString(),
                        "pcId", d.getPc().getId().toString(),
                        "demandaId", demanda.getId().toString(),
                        "tipoId", d.getTipo().getId().toString(),
                        "qtdRecebida", qtdRecebida
                ));
        return DoacaoDTO.from(d);
    }

    /** Distribui itens do estoque (saída). */
    @Transactional
    public void distribuir(UUID pcId, UUID tipoId, int quantidade, String observacao) {
        if (quantidade <= 0) throw new BusinessException("quantidade deve ser > 0");
        Pc pc = pcService.buscarVisivel(pcId);
        demandaService.exigirCoordOuWorker(pc);
        DemandaTipo tipo = demandaTipoRepository.findById(tipoId)
                .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado"));
        PcEstoque est = estoqueRepository.findByPcIdAndTipoId(pcId, tipoId)
                .orElseThrow(() -> new BusinessException("Sem estoque deste tipo no PC"));
        if (est.getQuantidade() < quantidade) {
            throw new BusinessException("Estoque insuficiente (disponível=" + est.getQuantidade() + ")");
        }
        Usuario actor = currentUser.require();
        est.setQuantidade(est.getQuantidade() - quantidade);
        est.setAlteradoPor(actor);
        registrar("DISTRIBUTED", pc, null, tipo, quantidade, null, actor, observacao);
        outbox.publish("EstoqueAlterado", "PcEstoque", est.getId(), "pc.estoque.alterado",
                java.util.Map.of(
                        "pcId", pc.getId().toString(),
                        "tipoId", tipo.getId().toString(),
                        "operacao", "DISTRIBUTED",
                        "quantidade", quantidade,
                        "saldo", est.getQuantidade()
                ));
    }

    /** Ajuste manual de estoque. */
    @Transactional
    public void ajustar(UUID pcId, UUID tipoId, int delta, String observacao) {
        if (delta == 0) throw new BusinessException("delta deve ser != 0");
        Pc pc = pcService.buscarVisivel(pcId);
        demandaService.exigirCoordOuWorker(pc);
        DemandaTipo tipo = demandaTipoRepository.findById(tipoId)
                .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado"));
        PcEstoque est = upsertEstoque(pc, tipo);
        int novo = est.getQuantidade() + delta;
        if (novo < 0) {
            throw new BusinessException("Ajuste levaria estoque a negativo");
        }
        Usuario actor = currentUser.require();
        est.setQuantidade(novo);
        est.setAlteradoPor(actor);
        registrar("ADJUSTED", pc, null, tipo, delta, null, actor, observacao);
        outbox.publish("EstoqueAlterado", "PcEstoque", est.getId(), "pc.estoque.alterado",
                java.util.Map.of(
                        "pcId", pc.getId().toString(),
                        "tipoId", tipo.getId().toString(),
                        "operacao", "ADJUSTED",
                        "quantidade", delta,
                        "saldo", est.getQuantidade()
                ));
    }

    // ============================================================================
    // JOBS / LISTENERS
    // ============================================================================

    @Scheduled(fixedDelayString = "PT5M", initialDelayString = "PT30S")
    @Transactional
    public void expirarIntencoes() {
        OffsetDateTime now = OffsetDateTime.now();
        List<DoacaoIntencao> vencidas =
                doacaoRepository.findByStatusAndDataExpiracaoBefore("PENDENTE", now);
        for (DoacaoIntencao d : vencidas) {
            d.setStatus("EXPIRADA");
            PcDemanda demanda = d.getDemanda();
            demanda.setQtdIntencionada(Math.max(0, demanda.getQtdIntencionada() - d.getQuantidade()));
            registrar("INTENT_EXPIRED", d.getPc(), demanda, d.getTipo(), d.getQuantidade(),
                    d, d.getUsuario(), null);
        }
        if (!vencidas.isEmpty()) {
            log.info("[DoacaoService] {} intencao(oes) expirada(s)", vencidas.size());
        }
    }

    /** Ao encerrar evento, reseta estoque do PC e fecha demandas pendentes. */
    @org.springframework.context.event.EventListener
    @Transactional
    public void onEventoEncerrado(br.com.iara.iara_api.service.alert.EventoEncerradoEvent e) {
        UUID eventoId = e.eventoId();
        var demandas = demandaRepository.listarPorEvento(eventoId);
        Map<UUID, Set<UUID>> pcTipos = new HashMap<>();
        for (PcDemanda d : demandas) {
            if (!"CLOSED".equals(d.getStatus()) && !"FULFILLED".equals(d.getStatus())) {
                d.setStatus("CLOSED");
                d.setActive(false);
                d.setDataFechamento(OffsetDateTime.now());
            }
            pcTipos.computeIfAbsent(d.getPc().getId(), k -> new HashSet<>()).add(d.getTipo().getId());
        }
        for (var entry : pcTipos.entrySet()) {
            UUID pcId = entry.getKey();
            Pc pc = pcRepository.findById(pcId).orElse(null);
            if (pc == null) continue;
            for (UUID tipoId : entry.getValue()) {
                estoqueRepository.findByPcIdAndTipoId(pcId, tipoId).ifPresent(est -> {
                    int antes = est.getQuantidade();
                    if (antes > 0) {
                        registrar("RESET_END_EVENT", pc, null, est.getTipo(), antes, null,
                                pc.getCoordenador(),
                                "Evento encerrado (" + e.motivo() + "); estoque zerado");
                        est.setQuantidade(0);
                    }
                });
            }
        }
    }

    // ============================================================================
    // INTERNAL
    // ============================================================================

    private PcEstoque upsertEstoque(Pc pc, DemandaTipo tipo) {
        return estoqueRepository.findByPcIdAndTipoId(pc.getId(), tipo.getId()).orElseGet(() -> {
            PcEstoque est = new PcEstoque();
            est.setPc(pc);
            est.setTipo(tipo);
            return estoqueRepository.save(est);
        });
    }

    private void registrar(String operacao, Pc pc, PcDemanda demanda, DemandaTipo tipo,
                           int quantidade, DoacaoIntencao intencao, Usuario actor, String obs) {
        InventoryTransaction t = new InventoryTransaction();
        t.setPcId(pc.getId());
        t.setEventoId(demanda != null ? demanda.getEvento().getId()
                : (intencao != null ? intencao.getDemanda().getEvento().getId() : null));
        t.setTipoId(tipo.getId());
        t.setOperacao(operacao);
        t.setQuantidade(quantidade);
        t.setUsuarioId(actor.getId());
        t.setIntencaoId(intencao != null ? intencao.getId() : null);
        t.setDemandaId(demanda != null ? demanda.getId() : null);
        t.setObservacao(obs);
        inventoryRepository.save(t);
    }
}
