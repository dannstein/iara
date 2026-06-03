package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.evento.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.messaging.NotificationPublisher;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.service.alert.EventoAprovadoEvent;
import br.com.iara.iara_api.service.alert.EventoEncerradoEvent;
import br.com.iara.iara_api.service.alert.EventoStatusChangedEvent;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventoService {

    private static final Set<String> SEVERIDADES = Set.of("BAIXA", "MEDIA", "ALTA", "CRITICA");
    private static final Set<String> STATUS_TRANSICAO = Set.of("ATIVO", "ALERTA_CRITICO", "ENCERRADO");

    private final EventoRepository eventoRepository;
    private final EventoHistoricoRepository historicoRepository;
    private final EventoUpvoteRepository upvoteRepository;
    private final EventoAvaliacaoRepository avaliacaoRepository;
    private final EventoEspecNecessariaRepository especNecessariaRepository;
    private final DesastreTipoRepository desastreTipoRepository;
    private final EspecRepository especRepository;
    private final UsuarioRepository usuarioRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;
    private final NotificationPublisher notificationPublisher;
    private final PcNotificacaoService pcNotificacaoService;
    private final ApplicationEventPublisher applicationEventPublisher;

    // ----------------------------------------------------------- CRUD / ciclo

    @Transactional
    public EventoDTO criar(CreateEventoRequest req) {
        if (!SEVERIDADES.contains(req.severidade())) {
            throw new BusinessException("Severidade inválida");
        }
        Usuario u = currentUser.require();
        DesastreTipo tipo = desastreTipoRepository.findById(req.idTipo())
                .orElseThrow(() -> new NotFoundException("Tipo de desastre não encontrado"));

        Evento e = new Evento();
        e.setTenant(u.getTenant());
        e.setTitulo(req.titulo());
        e.setDescricao(req.descricao());
        e.setTipo(tipo);
        e.setSeveridade(req.severidade());
        e.setSolicitante(u);
        e.setCoordenadas(GeoUtil.point(req.coordenadas()));
        if (req.raioMetros() != null) {
            e.setRaioMetros(req.raioMetros());
        }
        if (req.areaRisco() != null) {
            e.setAreaRisco(GeoUtil.fromGeoJson(req.areaRisco()));
        }
        e.setCobradeCod(req.cobradeCod());
        e.setSimulado(Boolean.TRUE.equals(req.isSimulado()));
        e.setStatus("SOLICITADO");
        eventoRepository.save(e);

        registrarHistorico(e, null, "SOLICITADO", u, "Evento criado");
        return EventoDTO.from(e, 0);
    }

    @Transactional(readOnly = true)
    public List<EventoDTO> listar(String status, String severidade, UUID tipoId, Boolean isSimulado) {
        Usuario u = currentUser.require();
        boolean simulado = isSimulado != null && isSimulado;
        return eventoRepository.filtrar(tenantScope.visibleTenantIds(u), status, severidade, tipoId, simulado)
                .stream().map(e -> EventoDTO.from(e, upvoteRepository.countByEventoId(e.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public EventoDTO detalhar(UUID id) {
        Evento e = buscarVisivel(id);
        return EventoDTO.from(e, upvoteRepository.countByEventoId(e.getId()));
    }

    @Transactional
    public EventoDTO atualizar(UUID id, UpdateEventoRequest req) {
        Evento e = buscarVisivel(id);
        if (req.titulo() != null) {
            e.setTitulo(req.titulo());
        }
        if (req.descricao() != null) {
            e.setDescricao(req.descricao());
        }
        if (req.severidade() != null) {
            if (!SEVERIDADES.contains(req.severidade())) {
                throw new BusinessException("Severidade inválida");
            }
            e.setSeveridade(req.severidade());
        }
        if (req.raioMetros() != null) {
            e.setRaioMetros(req.raioMetros());
        }
        if (req.areaRisco() != null) {
            e.setAreaRisco(GeoUtil.fromGeoJson(req.areaRisco()));
        }
        return EventoDTO.from(e, upvoteRepository.countByEventoId(e.getId()));
    }

    @Transactional
    public EventoDTO aprovar(UUID id) {
        Usuario gestor = currentUser.require();
        Evento e = buscarVisivel(id);
        if (!"SOLICITADO".equals(e.getStatus())) {
            throw new BusinessException("Apenas eventos SOLICITADOS podem ser aprovados");
        }
        String de = e.getStatus();
        e.setStatus("ATIVO");
        e.setAprovador(gestor);
        e.setDataAprovacao(java.time.OffsetDateTime.now());
        e.setDataInicio(java.time.OffsetDateTime.now());
        registrarHistorico(e, de, "ATIVO", gestor, "Evento aprovado");
        notificarTecnicos(e);
        pcNotificacaoService.notificarPcsProximos(e);
        applicationEventPublisher.publishEvent(
                new EventoAprovadoEvent(e.getId(), e.getTenant().getId(), gestor.getId()));
        return EventoDTO.from(e, upvoteRepository.countByEventoId(e.getId()));
    }

    @Transactional
    public EventoDTO mudarStatus(UUID id, StatusRequest req) {
        Usuario gestor = currentUser.require();
        Evento e = buscarVisivel(id);
        if (!STATUS_TRANSICAO.contains(req.status())) {
            throw new BusinessException("Status de transição inválido: " + req.status());
        }
        if ("SOLICITADO".equals(e.getStatus()) || "CANCELADO".equals(e.getStatus())) {
            throw new BusinessException("Evento " + e.getStatus() + " não permite transição direta de status");
        }
        String de = e.getStatus();
        e.setStatus(req.status());
        if ("ENCERRADO".equals(req.status())) {
            e.setDataEncerramento(java.time.OffsetDateTime.now());
            applicationEventPublisher.publishEvent(new EventoEncerradoEvent(e.getId(), "ENCERRADO"));
        }
        registrarHistorico(e, de, req.status(), gestor, req.observacao());
        applicationEventPublisher.publishEvent(
                new EventoStatusChangedEvent(e.getId(), e.getTenant().getId(), de, req.status()));
        return EventoDTO.from(e, upvoteRepository.countByEventoId(e.getId()));
    }

    @Transactional
    public EventoDTO cancelar(UUID id, String observacao) {
        Usuario gestor = currentUser.require();
        Evento e = buscarVisivel(id);
        if (!"SOLICITADO".equals(e.getStatus())) {
            throw new BusinessException("Apenas eventos SOLICITADOS podem ser cancelados");
        }
        String de = e.getStatus();
        e.setStatus("CANCELADO");
        registrarHistorico(e, de, "CANCELADO", gestor, observacao);
        applicationEventPublisher.publishEvent(new EventoEncerradoEvent(e.getId(), "CANCELADO"));
        return EventoDTO.from(e, 0);
    }

    @Transactional
    public void remover(UUID id) {
        Evento e = buscarVisivel(id);
        if (!Set.of("CANCELADO", "SOLICITADO").contains(e.getStatus())) {
            throw new BusinessException("Só é possível remover eventos CANCELADOS ou SOLICITADOS");
        }
        eventoRepository.delete(e);
    }

    // ----------------------------------------------------------- FIDE / S2ID

    @Transactional(readOnly = true)
    public FideDTO obterFide(UUID id) {
        return FideDTO.from(buscarVisivel(id));
    }

    @Transactional
    public FideDTO atualizarFide(UUID id, UpdateFideRequest req) {
        Evento e = buscarVisivel(id);
        e.setFideMunicipioAfetado(req.municipioAfetado());
        e.setFideDecretoMunicipal(req.decretoMunicipal());
        e.setFideDataDecreto(req.dataDecreto());
        e.setFidePopAfetada(req.popAfetada());
        e.setFideDanosMateriais(req.danosMateriais());
        e.setFideAcoesResposta(req.acoesResposta());
        e.setFideRecursosSolicitados(req.recursosSolicitados());
        e.setFidePrejuizoPublico(req.prejuizoPublico());
        e.setFidePrejuizoPrivado(req.prejuizoPrivado());
        e.setFideDanosHumanosDesc(req.danosHumanosDesc());
        if ("NAO_INICIADO".equals(e.getFideStatus())) {
            e.setFideStatus("EM_PREENCHIMENTO");
        }
        return FideDTO.from(e);
    }

    @Transactional(readOnly = true)
    public FideValidacaoDTO validarFide(UUID id) {
        return validar(buscarVisivel(id));
    }

    @Transactional
    public FideDTO submeterFide(UUID id) {
        Evento e = buscarVisivel(id);
        FideValidacaoDTO v = validar(e);
        if (!v.pronto()) {
            throw new BusinessException("RN17: FIDE não está pronto — " + v.motivoBloqueio());
        }
        e.setFideStatus("SUBMETIDO");
        return FideDTO.from(e);
    }

    private FideValidacaoDTO validar(Evento e) {
        if (e.getCobradeCod() == null || e.getCobradeCod().isBlank()) {
            return new FideValidacaoDTO(false, "Código COBRADE obrigatório");
        }
        if (e.getFideMunicipioAfetado() == null || e.getFideMunicipioAfetado().isBlank()) {
            return new FideValidacaoDTO(false, "Município afetado obrigatório");
        }
        if (e.getFidePrejuizoPublico() == null) {
            return new FideValidacaoDTO(false, "Prejuízo público (R$) obrigatório");
        }
        if (e.getFidePrejuizoPrivado() == null) {
            return new FideValidacaoDTO(false, "Prejuízo privado (R$) obrigatório");
        }
        if (e.getFideDanosHumanosDesc() == null || e.getFideDanosHumanosDesc().isBlank()) {
            return new FideValidacaoDTO(false, "Descrição de danos humanos obrigatória");
        }
        return new FideValidacaoDTO(true, null);
    }

    // ----------------------------------------------------------- upvotes / hist / aval

    @Transactional
    public long adicionarUpvote(UUID id) {
        Usuario u = currentUser.require();
        Evento e = buscarVisivel(id);
        if (upvoteRepository.existsByEventoIdAndUsuarioId(e.getId(), u.getId())) {
            throw new ConflictException("Upvote já registrado para este evento");
        }
        EventoUpvote up = new EventoUpvote();
        up.setEvento(e);
        up.setUsuario(u);
        upvoteRepository.save(up);
        return upvoteRepository.countByEventoId(e.getId());
    }

    @Transactional
    public long removerUpvote(UUID id) {
        Usuario u = currentUser.require();
        upvoteRepository.findByEventoIdAndUsuarioId(id, u.getId())
                .ifPresent(upvoteRepository::delete);
        return upvoteRepository.countByEventoId(id);
    }

    @Transactional(readOnly = true)
    public List<HistoricoDTO> historico(UUID id) {
        buscarVisivel(id);
        return historicoRepository.findByEventoIdOrderByCreatedAtDesc(id).stream()
                .map(HistoricoDTO::from).toList();
    }

    @Transactional
    public AvaliacaoDTO avaliar(UUID id, AvaliacaoRequest req) {
        Usuario u = currentUser.require();
        Evento e = buscarVisivel(id);
        if (avaliacaoRepository.existsByEventoIdAndUsuarioId(e.getId(), u.getId())) {
            throw new ConflictException("Você já avaliou este evento");
        }
        EventoAvaliacao a = new EventoAvaliacao();
        a.setEvento(e);
        a.setUsuario(u);
        a.setNota(req.nota());
        a.setPontosPositivos(req.pontosPositivos());
        a.setPontosMelhoria(req.pontosMelhoria());
        return AvaliacaoDTO.from(avaliacaoRepository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoDTO> listarAvaliacoes(UUID id) {
        buscarVisivel(id);
        return avaliacaoRepository.findByEventoIdOrderByCreatedAtDesc(id).stream()
                .map(AvaliacaoDTO::from).toList();
    }

    // ----------------------------------------------------------- espec necessária

    @Transactional
    public EspecNecessariaDTO declararEspec(UUID id, EspecNecessariaRequest req) {
        Evento e = buscarVisivel(id);
        Espec espec = especRepository.findById(req.idEspec())
                .orElseThrow(() -> new NotFoundException("Especialidade não encontrada"));
        EventoEspecNecessaria en = especNecessariaRepository
                .findByEventoIdAndEspecId(e.getId(), espec.getId())
                .orElseGet(() -> {
                    EventoEspecNecessaria nova = new EventoEspecNecessaria();
                    nova.setEvento(e);
                    nova.setEspec(espec);
                    return nova;
                });
        en.setQtdNecessaria(req.qtdNecessaria());
        return EspecNecessariaDTO.from(especNecessariaRepository.save(en));
    }

    @Transactional(readOnly = true)
    public List<EspecNecessariaDTO> listarEspecs(UUID id) {
        buscarVisivel(id);
        return especNecessariaRepository.findByEventoId(id).stream()
                .map(EspecNecessariaDTO::from).toList();
    }

    @Transactional
    public EspecNecessariaDTO atualizarEspec(UUID id, UUID especId, EspecNecessariaRequest req) {
        buscarVisivel(id);
        EventoEspecNecessaria en = especNecessariaRepository.findByEventoIdAndEspecId(id, especId)
                .orElseThrow(() -> new NotFoundException("Especialidade necessária não encontrada"));
        en.setQtdNecessaria(req.qtdNecessaria());
        return EspecNecessariaDTO.from(en);
    }

    @Transactional
    public void removerEspec(UUID id, UUID especId) {
        buscarVisivel(id);
        EventoEspecNecessaria en = especNecessariaRepository.findByEventoIdAndEspecId(id, especId)
                .orElseThrow(() -> new NotFoundException("Especialidade necessária não encontrada"));
        especNecessariaRepository.delete(en);
    }

    @Transactional(readOnly = true)
    public List<TecnicoDisponivelDTO> tecnicosDisponiveis(UUID id, UUID especId, Integer raioOverride) {
        Evento e = buscarVisivel(id);
        int raio = raioOverride != null ? raioOverride : e.getRaioMetros();
        double lat = e.getCoordenadas().getY();
        double lng = e.getCoordenadas().getX();
        return usuarioRepository
                .tecnicosDisponiveis(lat, lng, raio, especId != null ? especId.toString() : null)
                .stream().map(TecnicoDisponivelDTO::from).toList();
    }

    // ----------------------------------------------------------- helpers

    /** Carrega o evento garantindo visibilidade de tenant. Reutilizado por sub-recursos. */
    @Transactional(readOnly = true)
    public Evento buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        Evento e = eventoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
        if (!tenantScope.canSee(u, e.getTenant().getId())) {
            throw new ForbiddenException("Evento fora do seu escopo de tenant");
        }
        return e;
    }

    private void registrarHistorico(Evento e, String de, String para, Usuario resp, String obs) {
        EventoHistorico h = new EventoHistorico();
        h.setEvento(e);
        h.setStatusDe(de);
        h.setStatusPara(para);
        h.setResponsavel(resp);
        h.setObservacao(obs);
        historicoRepository.save(h);
    }

    private void notificarTecnicos(Evento e) {
        double lat = e.getCoordenadas().getY();
        double lng = e.getCoordenadas().getX();
        usuarioRepository.tecnicosDisponiveis(lat, lng, e.getRaioMetros(), null).forEach(tec ->
                notificationPublisher.notify(tec.getId(), "Novo evento ativo: " + e.getTitulo(),
                        "Um evento foi ativado na sua área de atuação.", "EVENTO", e.getId()));
    }
}
