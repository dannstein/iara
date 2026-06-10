package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.AlertaDestinatario;
import br.com.iara.iara_api.domain.AlertaEscalationLog;
import br.com.iara.iara_api.domain.AlertaTipo;
import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.Tenant;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.domain.ZonaRisco;
import br.com.iara.iara_api.dto.alerta.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.service.alert.AlertaCooldownService;
import br.com.iara.iara_api.service.alert.AlertaDispatcher;
import br.com.iara.iara_api.service.alert.AlertaTargetingService;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final AlertaRepository alertaRepository;
    private final AlertaTipoRepository alertaTipoRepository;
    private final AlertaDestinatarioRepository destinatarioRepository;
    private final AlertaEscalationLogRepository escalationLogRepository;
    private final EventoRepository eventoRepository;
    private final ZonaRiscoRepository zonaRiscoRepository;
    private final TenantRepository tenantRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;
    private final AlertaCooldownService cooldownService;
    private final AlertaTargetingService targetingService;
    private final AlertaDispatcher dispatcher;
    private final br.com.iara.iara_api.service.alert.AlertaPushService pushService;

    // ============================================================================
    // CREATE — uma por categoria
    // ============================================================================

    @Transactional
    public AlertaDTO criarDangerZone(CreateDangerZoneAlertRequest req) {
        Usuario u = currentUser.require();
        if (!req.todasZonas() && req.idZonaRisco() == null) {
            throw new BusinessException("Informe idZonaRisco ou marque todasZonas=true");
        }
        ZonaRisco zona = null;
        if (req.idZonaRisco() != null) {
            zona = zonaRiscoRepository.findById(req.idZonaRisco())
                    .orElseThrow(() -> new NotFoundException("Zona de risco não encontrada"));
            if (!tenantScope.canSee(u, zona.getTenant().getId())) {
                throw new ForbiddenException("Zona de risco fora do seu escopo");
            }
        }
        String dedup = AlertaCooldownService.dedupKey("DZ",
                req.todasZonas() ? "ALL" : req.idZonaRisco(),
                req.severidade(), String.join(",", req.geofenceModes()));
        CooldownDecision cd = applyCooldown("DANGER_ZONE", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "DANGER_ZONE", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("DANGER_ZONE_USERS");
        Alerta a = newAlerta(u, tipo, "DANGER_ZONE", req.severidade(),
                or(req.titulo(), defaultTituloDangerZone(zona)),
                or(req.mensagem(), defaultMensagemDangerZone(zona)));
        a.setZonaRisco(zona);
        a.setGeofenceModes(String.join(",", req.geofenceModes()));
        a.setRaioMetros(req.raioMetros());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        a.setRequerAck(req.requerAck());
        alertaRepository.save(a);
        registerCooldown("DANGER_ZONE", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetDangerZone(
                req.idZonaRisco(), req.todasZonas(), req.geofenceModes(),
                req.raioMetros(), tenantScope.baseVisibleTenantIds(u),
                req.lastHours(), req.frequentMinDays(), req.frequentLastDays());
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarEventZone(CreateEventZoneAlertRequest req) {
        Usuario u = currentUser.require();
        if (!req.todosEventos() && req.idEvento() == null) {
            throw new BusinessException("Informe idEvento ou marque todosEventos=true");
        }
        Evento evento = null;
        if (req.idEvento() != null) {
            evento = eventoRepository.findById(req.idEvento())
                    .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
            if (!tenantScope.canSee(u, evento.getTenant().getId())) {
                throw new ForbiddenException("Evento fora do seu escopo");
            }
        }
        String dedup = AlertaCooldownService.dedupKey("EZ",
                req.todosEventos() ? "ALL" : req.idEvento(),
                req.severidade(), String.join(",", req.geofenceModes()));
        CooldownDecision cd = applyCooldown("EVENT_ZONE", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "EVENT_ZONE", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("EVENT_ZONE_USERS");
        Alerta a = newAlerta(u, tipo, "EVENT_ZONE", req.severidade(),
                or(req.titulo(), defaultTituloEventZone(evento)),
                or(req.mensagem(), defaultMensagemEventZone(evento)));
        a.setEvento(evento);
        a.setGeofenceModes(String.join(",", req.geofenceModes()));
        a.setRaioMetros(req.raioMetros());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        a.setRequerAck(req.requerAck());
        alertaRepository.save(a);
        registerCooldown("EVENT_ZONE", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetEventZone(
                req.idEvento(), req.todosEventos(), req.geofenceModes(),
                req.raioMetros(), tenantScope.baseVisibleTenantIds(u),
                req.lastHours(), req.frequentMinDays(), req.frequentLastDays());
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarTenantBroadcast(CreateTenantBroadcastRequest req) {
        Usuario u = currentUser.require();
        if (!tenantScope.canSee(u, req.idTenantAlvo())) {
            throw new ForbiddenException("Tenant alvo fora do seu escopo");
        }
        String dedup = AlertaCooldownService.dedupKey("TB", req.idTenantAlvo(), req.targetRole(),
                req.severidade(), req.mensagem() != null ? req.mensagem().substring(0, Math.min(50, req.mensagem().length())) : "");
        CooldownDecision cd = applyCooldown("TENANT_BROADCAST", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "TENANT_BROADCAST", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("TENANT_BROADCAST");
        Tenant tenantAlvo = tenantRepository.findById(req.idTenantAlvo())
                .orElseThrow(() -> new NotFoundException("Tenant alvo não encontrado"));
        Alerta a = newAlerta(u, tipo, "TENANT_BROADCAST", req.severidade(),
                or(req.titulo(), "Aviso da Defesa Civil — " + tenantAlvo.getNome()),
                req.mensagem());
        a.setTenant(tenantAlvo); // broadcast: o tenant do alerta é o alvo
        a.setTargetRole(req.targetRole());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        alertaRepository.save(a);
        registerCooldown("TENANT_BROADCAST", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetTenantBroadcast(
                req.idTenantAlvo(), req.targetRole(), tenantScope.baseVisibleTenantIds(u));
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarTechnicalRequest(CreateTechnicalRequestAlertRequest req) {
        Usuario u = currentUser.require();
        Evento evento = eventoRepository.findById(req.idEvento())
                .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
        if (!tenantScope.canSee(u, evento.getTenant().getId())) {
            throw new ForbiddenException("Evento fora do seu escopo");
        }
        String dedup = AlertaCooldownService.dedupKey("TR", req.idEvento(), req.especialidadeId(),
                req.tenantWide(), req.raioMetros());
        CooldownDecision cd = applyCooldown("TECHNICAL_REQUEST", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "TECHNICAL_REQUEST", u.getTenant().getId(), dedup, "SOLICITATION");
        }

        AlertaTipo tipo = tipoOrDefault("TECHNICAL_REQUEST");
        Alerta a = newAlerta(u, tipo, "TECHNICAL_REQUEST", "SOLICITATION",
                or(req.titulo(), "Solicitação de técnicos: " + evento.getTitulo()),
                or(req.mensagem(), "Sua presença foi requisitada no evento " + evento.getTitulo() + "."));
        a.setEvento(evento);
        a.setTargetRole("TECNICO");
        a.setRaioMetros(req.raioMetros() != null ? req.raioMetros() : evento.getRaioMetros());
        a.setRequerAck(true);
        a.setAckMinimo(req.ackMinimo());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        // Expansion config (2B): só faz sentido se ackMinimo > 0
        if (req.expansionRadiiMetros() != null && !req.expansionRadiiMetros().isEmpty()
                && req.ackMinimo() != null && req.ackMinimo() > 0) {
            String csv = req.expansionRadiiMetros().stream()
                    .map(String::valueOf).reduce((x, y) -> x + "," + y).orElse("");
            a.setExpansionRadiiMetros(csv);
            a.setExpansionWindowMinutes(req.expansionWindowMinutes() != null
                    ? req.expansionWindowMinutes() : 5);
            a.setLastExpansionAt(OffsetDateTime.now());
        }
        alertaRepository.save(a);
        registerCooldown("TECHNICAL_REQUEST", u.getTenant().getId(), dedup, "SOLICITATION", a.getId());

        Set<UUID> destinatarios = targetingService.targetTechnicians(
                req.idEvento(), req.especialidadeId(), req.raioMetros(), req.tenantWide(),
                tenantScope.baseVisibleTenantIds(u));
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarSupportPoints(CreateSupportPointsAlertRequest req) {
        Usuario u = currentUser.require();
        ZonaRisco zona = zonaRiscoRepository.findById(req.idZonaRisco())
                .orElseThrow(() -> new NotFoundException("Zona de risco não encontrada"));
        if (!tenantScope.canSee(u, zona.getTenant().getId())) {
            throw new ForbiddenException("Zona de risco fora do seu escopo");
        }
        String dedup = AlertaCooldownService.dedupKey("SP", req.idZonaRisco(),
                req.escopoTipo(), req.raioMetros(), req.severidade());
        CooldownDecision cd = applyCooldown("SUPPORT_POINTS", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "SUPPORT_POINTS", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("SUPPORT_POINTS_ALERT");
        Alerta a = newAlerta(u, tipo, "SUPPORT_POINTS", req.severidade(),
                or(req.titulo(), "Aviso a pontos de apoio: " + zona.getNome()),
                or(req.mensagem(), "Risco iminente próximo à zona " + zona.getNome() + ". Prepare-se."));
        a.setZonaRisco(zona);
        a.setRaioMetros(req.raioMetros());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        alertaRepository.save(a);
        registerCooldown("SUPPORT_POINTS", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetSupportPoints(
                req.idZonaRisco(), req.escopoTipo(), req.raioMetros(),
                tenantScope.baseVisibleTenantIds(u));
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarCollectionPoints(CreateCollectionPointsAlertRequest req) {
        Usuario u = currentUser.require();
        Evento evento = eventoRepository.findById(req.idEvento())
                .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
        if (!tenantScope.canSee(u, evento.getTenant().getId())) {
            throw new ForbiddenException("Evento fora do seu escopo");
        }
        String dedup = AlertaCooldownService.dedupKey("CP", req.idEvento(),
                req.escopoTipo(), req.raioMetros(), req.severidade());
        CooldownDecision cd = applyCooldown("COLLECTION_POINTS", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "COLLECTION_POINTS", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("COLLECTION_POINTS_ALERT");
        Alerta a = newAlerta(u, tipo, "COLLECTION_POINTS", req.severidade(),
                or(req.titulo(), "Aviso a pontos de coleta: " + evento.getTitulo()),
                or(req.mensagem(), "Atualização sobre o evento " + evento.getTitulo() + "."));
        a.setEvento(evento);
        a.setRaioMetros(req.raioMetros());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        alertaRepository.save(a);
        registerCooldown("COLLECTION_POINTS", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetCollectionPoints(
                req.idEvento(), req.escopoTipo(), req.raioMetros(),
                tenantScope.baseVisibleTenantIds(u));
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarMonitors(CreateMonitorsAlertRequest req) {
        Usuario u = currentUser.require();
        if (req.idEvento() == null && req.idZonaRisco() == null && !"TENANT".equals(req.escopoTipo())) {
            throw new BusinessException("Informe idEvento, idZonaRisco ou escopoTipo=TENANT");
        }
        Evento evento = null;
        ZonaRisco zona = null;
        if (req.idEvento() != null) {
            evento = eventoRepository.findById(req.idEvento())
                    .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
        }
        if (req.idZonaRisco() != null) {
            zona = zonaRiscoRepository.findById(req.idZonaRisco())
                    .orElseThrow(() -> new NotFoundException("Zona de risco não encontrada"));
        }
        String dedup = AlertaCooldownService.dedupKey("MN", req.idEvento(), req.idZonaRisco(),
                req.escopoTipo(), req.raioMetros(), req.severidade());
        CooldownDecision cd = applyCooldown("MONITORS", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "MONITORS", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("MONITORS_ALERT");
        Alerta a = newAlerta(u, tipo, "MONITORS", req.severidade(),
                or(req.titulo(), "Comunicado aos monitores"),
                req.mensagem() != null ? req.mensagem() : "Atualização operacional.");
        a.setEvento(evento);
        a.setZonaRisco(zona);
        a.setTargetRole("MONITOR");
        a.setRaioMetros(req.raioMetros());
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        alertaRepository.save(a);
        registerCooldown("MONITORS", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetMonitors(
                req.idEvento(), req.idZonaRisco(), req.escopoTipo(), req.raioMetros(),
                tenantScope.baseVisibleTenantIds(u));
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO criarPersonalized(CreatePersonalizedAlertRequest req) {
        Usuario u = currentUser.require();
        UUID tenantAlvo = req.idTenantAlvo() != null ? req.idTenantAlvo() : u.getTenant().getId();
        if (!tenantScope.canSee(u, tenantAlvo)) {
            throw new ForbiddenException("Tenant alvo fora do seu escopo");
        }
        String dedup = AlertaCooldownService.dedupKey("PZ", tenantAlvo, req.targetRole(),
                req.severidade(), req.titulo());
        CooldownDecision cd = applyCooldown("PERSONALIZED", u.getTenant().getId(), dedup);
        if (cd.merged()) {
            return mergeAlerta(cd.mergedWith(), "PERSONALIZED", u.getTenant().getId(), dedup, req.severidade());
        }

        AlertaTipo tipo = tipoOrDefault("PERSONALIZED");
        Tenant t = tenantRepository.findById(tenantAlvo)
                .orElseThrow(() -> new NotFoundException("Tenant alvo não encontrado"));
        Alerta a = newAlerta(u, tipo, "PERSONALIZED", req.severidade(), req.titulo(), req.mensagem());
        a.setTenant(t);
        a.setTargetRole(req.targetRole());
        if (req.coordenadas() != null) {
            a.setCoordenadas(GeoUtil.point(req.coordenadas()));
        }
        a.setRaioMetros(req.raioMetros());
        if (req.geofenceModes() != null && !req.geofenceModes().isEmpty()) {
            a.setGeofenceModes(String.join(",", req.geofenceModes()));
        }
        if (req.idEvento() != null) {
            a.setEvento(eventoRepository.findById(req.idEvento())
                    .orElseThrow(() -> new NotFoundException("Evento não encontrado")));
        }
        if (req.idZonaRisco() != null) {
            a.setZonaRisco(zonaRiscoRepository.findById(req.idZonaRisco())
                    .orElseThrow(() -> new NotFoundException("Zona de risco não encontrada")));
        }
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        a.setRequerAck(req.requerAck());
        alertaRepository.save(a);
        registerCooldown("PERSONALIZED", u.getTenant().getId(), dedup, req.severidade(), a.getId());

        Set<UUID> destinatarios = targetingService.targetPersonalized(
                req.coordenadas(), req.raioMetros(), req.geofenceModes(),
                req.targetRole(), tenantAlvo, tenantScope.baseVisibleTenantIds(u),
                req.lastHours(), req.frequentMinDays(), req.frequentLastDays());
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    // ============================================================================
    // ESCALATION
    // ============================================================================

    @Transactional
    public AlertaDTO escalonar(EscalateAlertRequest req) {
        Usuario u = currentUser.require();
        if (!tenantScope.isAncestor(u, req.idTenantAlvo())) {
            throw new ForbiddenException(
                    "Escalonamento exige tenant ANCESTRAL do seu — não é possível escalar lateralmente");
        }
        // Severidade mínima para escalation
        Set<String> permitidas = Set.of("DANGER", "CRITICAL", "EMERGENCY");
        if (!permitidas.contains(req.severidade())) {
            throw new BusinessException("Escalonamento exige severidade DANGER, CRITICAL ou EMERGENCY");
        }

        Tenant tenantAlvo = tenantRepository.findById(req.idTenantAlvo())
                .orElseThrow(() -> new NotFoundException("Tenant alvo não encontrado"));
        AlertaTipo tipo = tipoOrDefault("ESCALATION");

        Alerta a = newAlerta(u, tipo, "ESCALATION", req.severidade(), req.titulo(), req.mensagem());
        a.setTenant(tenantAlvo); // alerta vive no tenant alvo
        a.setTargetRole("GESTOR");
        a.setEscalation(true);
        a.setEscalationMotivo(req.motivo());
        a.setEscalationFromTenant(u.getTenant().getId());
        if (req.idEvento() != null) {
            a.setEvento(eventoRepository.findById(req.idEvento()).orElse(null));
        }
        if (req.idZonaRisco() != null) {
            a.setZonaRisco(zonaRiscoRepository.findById(req.idZonaRisco()).orElse(null));
        }
        a.setDataExpiracao(req.dataExpiracao());
        a.setAutoExpireMinutes(req.autoExpireMinutes());
        alertaRepository.save(a);

        // Audit log
        AlertaEscalationLog log = new AlertaEscalationLog();
        log.setAlerta(a);
        log.setEscalador(u);
        log.setFromTenant(u.getTenant().getId());
        log.setToTenant(req.idTenantAlvo());
        log.setMotivo(req.motivo());
        escalationLogRepository.save(log);

        Set<UUID> destinatarios = targetingService.targetEscalation(req.idTenantAlvo());
        dispatcher.dispatch(a, destinatarios);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    // ============================================================================
    // MANAGEMENT
    // ============================================================================

    @Transactional
    public AlertaDTO resolver(UUID id) {
        Usuario u = currentUser.require();
        Alerta a = buscarVisivel(id);
        if (!"ACTIVE".equals(a.getStatus())) {
            throw new BusinessException("Apenas alertas ACTIVE podem ser resolvidos");
        }
        a.setStatus("RESOLVED");
        a.setDataResolvido(OffsetDateTime.now());
        a.setResolvedoPor(u);
        pushService.pushStatusChange(a);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public AlertaDTO cancelar(UUID id) {
        Usuario u = currentUser.require();
        Alerta a = buscarVisivel(id);
        if (!"ACTIVE".equals(a.getStatus())) {
            throw new BusinessException("Apenas alertas ACTIVE podem ser cancelados");
        }
        a.setStatus("CANCELLED");
        a.setDataResolvido(OffsetDateTime.now());
        a.setResolvedoPor(u);
        pushService.pushStatusChange(a);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional(readOnly = true)
    public List<AlertaDTO> listar(String status, String severidade, String categoria,
                                  UUID idEvento, UUID idZonaRisco) {
        Usuario u = currentUser.require();
        return alertaRepository.filtrarParaUsuario(u.getId(), tenantScope.visibleTenantIds(u),
                        status, severidade, categoria, idEvento, idZonaRisco)
                .stream().map(a -> AlertaDTO.from(a, computeSummary(a.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaDTO> geofencing(double lat, double lng) {
        Usuario u = currentUser.require();
        return alertaRepository.geofencing(lat, lng, tenantScope.visibleTenantIds(u))
                .stream().map(AlertaDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public AlertaDTO detalhar(UUID id) {
        Alerta a = buscarVisivel(id);
        return AlertaDTO.from(a, computeSummary(a.getId()));
    }

    @Transactional
    public void deletar(UUID id) {
        Alerta a = buscarVisivel(id);
        alertaRepository.delete(a);
    }

    @Transactional(readOnly = true)
    public List<AlertaDestinatarioDTO> listarDestinatarios(UUID alertaId, String status) {
        buscarVisivel(alertaId);
        return destinatarioRepository.filtrarPorAlerta(alertaId, status)
                .stream().map(AlertaDestinatarioDTO::from).toList();
    }

    // ============================================================================
    // VISUALIZED / ACK (chamado pelo destinatário)
    // ============================================================================

    /**
     * Marca o alerta como visualizado pelo destinatário atual. Idempotente:
     * apenas avança o estado (SENT/DELIVERED → VISUALIZED). Não regride.
     */
    @Transactional
    public AlertaDestinatarioDTO visualizar(UUID alertaId) {
        Usuario u = currentUser.require();
        AlertaDestinatario d = destinatarioRepository.findByAlertaIdAndUsuarioId(alertaId, u.getId())
                .orElseThrow(() -> new NotFoundException("Você não é destinatário deste alerta"));
        if (d.getVisualizedAt() == null) {
            d.setVisualizedAt(OffsetDateTime.now());
        }
        // Só avança o status se ainda estiver em SENT/DELIVERED
        if ("SENT".equals(d.getDeliveryStatus()) || "DELIVERED".equals(d.getDeliveryStatus())) {
            d.setDeliveryStatus("VISUALIZED");
        }
        return AlertaDestinatarioDTO.from(d);
    }

    @Transactional
    public AlertaDestinatarioDTO ack(UUID alertaId, AckRequest req) {
        Usuario u = currentUser.require();
        AlertaDestinatario d = destinatarioRepository.findByAlertaIdAndUsuarioId(alertaId, u.getId())
                .orElseThrow(() -> new NotFoundException("Você não é destinatário deste alerta"));
        OffsetDateTime now = OffsetDateTime.now();
        String acao = req.acao();
        switch (acao) {
            case "ACKNOWLEDGE" -> {
                if (d.getAcknowledgedAt() == null) d.setAcknowledgedAt(now);
                if ("SENT".equals(d.getDeliveryStatus()) || "DELIVERED".equals(d.getDeliveryStatus())
                        || "VISUALIZED".equals(d.getDeliveryStatus())) {
                    d.setDeliveryStatus("ACKNOWLEDGED");
                }
            }
            case "ACCEPT", "REFUSE", "UNAVAILABLE" -> {
                d.setResponse(acao);
                d.setRespondedAt(now);
                if (d.getAcknowledgedAt() == null) d.setAcknowledgedAt(now);
                d.setDeliveryStatus("RESPONDED");
            }
            default -> throw new BusinessException("Ação inválida: " + acao);
        }
        return AlertaDestinatarioDTO.from(d);
    }

    // ============================================================================
    // DASHBOARD / KPIs
    // ============================================================================

    @Transactional(readOnly = true)
    public AlertaDashboardDTO dashboard() {
        Usuario u = currentUser.require();
        List<UUID> tenantIds = tenantScope.visibleTenantIds(u);
        long ativos = alertaRepository.countByTenantIdInAndStatus(tenantIds, "ACTIVE");
        long criticosAtivos = alertaRepository.countByTenantIdInAndStatusAndSeveridadeIn(
                tenantIds, "ACTIVE", List.of("CRITICAL", "EMERGENCY"));
        long acksPendentes = destinatarioRepository.countAcksPendentes(tenantIds);
        OffsetDateTime startOfDay = OffsetDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        long resolvidosHoje = alertaRepository.countByTenantIdInAndStatusAndDataResolvidoGreaterThanEqual(
                tenantIds, "RESOLVED", startOfDay);

        Map<String, Long> porSeveridade = new LinkedHashMap<>();
        Map<String, Long> porCategoria = new LinkedHashMap<>();
        for (Alerta a : alertaRepository.filtrar(tenantIds, "ACTIVE", null, null, null, null)) {
            porSeveridade.merge(a.getSeveridade(), 1L, Long::sum);
            porCategoria.merge(a.getCategoria(), 1L, Long::sum);
        }
        return new AlertaDashboardDTO(ativos, criticosAtivos, acksPendentes, resolvidosHoje,
                porSeveridade, porCategoria);
    }

    // ============================================================================
    // Helpers
    // ============================================================================

    /**
     * Resultado da decisão de cooldown: se mergedWith != null, o caller usa
     * {@link #mergeAlerta} para absorver no alerta existente; caso contrário,
     * prossegue criando o novo alerta e DEPOIS chama {@code cooldownService.register}
     * (helper {@link #registerCooldown}) para gravar o id do novo alerta.
     */
    private record CooldownDecision(boolean merged, Alerta mergedWith) {}

    private CooldownDecision applyCooldown(String categoria, UUID tenantId, String dedupKey) {
        AlertaCooldownService.CooldownResult r = cooldownService.peek(categoria, tenantId, dedupKey);
        if (!r.blocked()) {
            return new CooldownDecision(false, null);
        }
        Alerta existing = alertaRepository.findById(r.existingAlertaId()).orElse(null);
        if (existing == null || !"ACTIVE".equals(existing.getStatus())) {
            // Cache aponta para alerta não-ativo — trata como fresh
            return new CooldownDecision(false, null);
        }
        return new CooldownDecision(true, existing);
    }

    /** Registra o id do alerta recém-criado no Redis (após persist). */
    private void registerCooldown(String categoria, UUID tenantId, String dedupKey,
                                   String severidade, UUID alertaId) {
        cooldownService.register(categoria, tenantId, dedupKey, severidade, alertaId);
    }

    private AlertaDTO mergeAlerta(Alerta existing, String categoria, UUID tenantId,
                                   String dedupKey, String severidade) {
        existing.setMergedCount(existing.getMergedCount() + 1);
        OffsetDateTime base = existing.getDataExpiracao() != null
                ? existing.getDataExpiracao() : OffsetDateTime.now();
        existing.setDataExpiracao(base.plusMinutes(30));
        cooldownService.register(categoria, tenantId, dedupKey, severidade, existing.getId());
        return AlertaDTO.from(existing, computeSummary(existing.getId()), true);
    }

    private Alerta buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        Alerta a = alertaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Alerta não encontrado"));
        if (!tenantScope.canSee(u, a.getTenant().getId())) {
            throw new ForbiddenException("Alerta fora do seu escopo de tenant");
        }
        return a;
    }

    private Alerta newAlerta(Usuario emissor, AlertaTipo tipo, String categoria,
                             String severidade, String titulo, String mensagem) {
        Alerta a = new Alerta();
        a.setTenant(emissor.getTenant());
        a.setEmissor(emissor);
        a.setTipo(tipo);
        a.setCategoria(categoria);
        a.setSeveridade(severidade);
        a.setTitulo(titulo);
        a.setMensagem(mensagem);
        a.setStatus("ACTIVE");
        return a;
    }

    private AlertaTipo tipoOrDefault(String tipoNome) {
        return alertaTipoRepository.findByTipoNome(tipoNome)
                .orElseThrow(() -> new NotFoundException("Tipo de alerta '" + tipoNome + "' não encontrado"));
    }

    private AckSummaryDTO computeSummary(UUID alertaId) {
        java.util.List<Object[]> rows = destinatarioRepository.ackSummary(alertaId);
        if (rows == null || rows.isEmpty()) {
            return new AckSummaryDTO(0, 0, 0, 0, 0, 0, 0, 0);
        }
        Object[] row = rows.get(0);
        return new AckSummaryDTO(
                ((Number) row[0]).intValue(),
                ((Number) row[1]).intValue(),
                ((Number) row[2]).intValue(),
                ((Number) row[3]).intValue(),
                ((Number) row[4]).intValue(),
                ((Number) row[5]).intValue(),
                ((Number) row[6]).intValue(),
                ((Number) row[7]).intValue()
        );
    }

    private static String or(String value, String fallback) {
        return value != null && !value.isBlank() ? value : fallback;
    }

    private static String defaultTituloDangerZone(ZonaRisco z) {
        return z != null ? "Risco em " + z.getNome() : "Atenção: zonas de risco ativadas";
    }

    private static String defaultMensagemDangerZone(ZonaRisco z) {
        return z != null
                ? "Risco identificado em " + z.getNome() + ". Tome precauções e mantenha-se informado."
                : "Há risco identificado em zonas próximas. Mantenha-se informado e tome precauções.";
    }

    private static String defaultTituloEventZone(Evento e) {
        return e != null ? "Alerta: " + e.getTitulo() : "Aviso de evento em curso";
    }

    private static String defaultMensagemEventZone(Evento e) {
        return e != null
                ? "Há um evento ativo em sua área: " + e.getTitulo() + ". Siga orientações da Defesa Civil."
                : "Eventos ativos em sua área. Siga orientações da Defesa Civil.";
    }
}
