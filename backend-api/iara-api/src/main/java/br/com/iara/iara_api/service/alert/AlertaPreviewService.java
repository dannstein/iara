package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.alerta.*;
import br.com.iara.iara_api.repository.UsuarioRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Executa o targeting de um alerta SEM persistir nem publicar. Usado pela UI
 * de criação para mostrar a contagem estimada de destinatários antes de confirmar.
 *
 * <p>Cooldown é consultado em modo "peek" — não consome a janela.
 */
@Service
@RequiredArgsConstructor
public class AlertaPreviewService {

    private final AlertaTargetingService targetingService;
    private final AlertaCooldownService cooldownService;
    private final UsuarioRepository usuarioRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewDangerZone(CreateDangerZoneAlertRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetDangerZone(
                req.idZonaRisco(), req.todasZonas(), req.geofenceModes(),
                req.raioMetros(), visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("DZ",
                req.todasZonas() ? "ALL" : req.idZonaRisco(),
                req.severidade(), String.join(",", req.geofenceModes()));
        boolean cooldown = cooldownService.isActive("DANGER_ZONE", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewEventZone(CreateEventZoneAlertRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetEventZone(
                req.idEvento(), req.todosEventos(), req.geofenceModes(),
                req.raioMetros(), visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("EZ",
                req.todosEventos() ? "ALL" : req.idEvento(),
                req.severidade(), String.join(",", req.geofenceModes()));
        boolean cooldown = cooldownService.isActive("EVENT_ZONE", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewTenantBroadcast(CreateTenantBroadcastRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetTenantBroadcast(
                req.idTenantAlvo(), req.targetRole(), visibleTenants);
        String msgPart = req.mensagem() != null
                ? req.mensagem().substring(0, Math.min(50, req.mensagem().length())) : "";
        String dedup = AlertaCooldownService.dedupKey("TB", req.idTenantAlvo(), req.targetRole(),
                req.severidade(), msgPart);
        boolean cooldown = cooldownService.isActive("TENANT_BROADCAST", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewTechnicalRequest(CreateTechnicalRequestAlertRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetTechnicians(
                req.idEvento(), req.especialidadeId(), req.raioMetros(), req.tenantWide(),
                visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("TR", req.idEvento(), req.especialidadeId(),
                req.tenantWide(), req.raioMetros());
        boolean cooldown = cooldownService.isActive("TECHNICAL_REQUEST", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewSupportPoints(CreateSupportPointsAlertRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetSupportPoints(
                req.idZonaRisco(), req.escopoTipo(), req.raioMetros(), visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("SP", req.idZonaRisco(),
                req.escopoTipo(), req.raioMetros(), req.severidade());
        boolean cooldown = cooldownService.isActive("SUPPORT_POINTS", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewCollectionPoints(CreateCollectionPointsAlertRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetCollectionPoints(
                req.idEvento(), req.escopoTipo(), req.raioMetros(), visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("CP", req.idEvento(),
                req.escopoTipo(), req.raioMetros(), req.severidade());
        boolean cooldown = cooldownService.isActive("COLLECTION_POINTS", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewMonitors(CreateMonitorsAlertRequest req) {
        Usuario u = currentUser.require();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetMonitors(
                req.idEvento(), req.idZonaRisco(), req.escopoTipo(), req.raioMetros(), visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("MN", req.idEvento(), req.idZonaRisco(),
                req.escopoTipo(), req.raioMetros(), req.severidade());
        boolean cooldown = cooldownService.isActive("MONITORS", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewPersonalized(CreatePersonalizedAlertRequest req) {
        Usuario u = currentUser.require();
        UUID tenantAlvo = req.idTenantAlvo() != null ? req.idTenantAlvo() : u.getTenant().getId();
        List<UUID> visibleTenants = tenantScope.baseVisibleTenantIds(u);
        Set<UUID> ids = targetingService.targetPersonalized(
                req.coordenadas(), req.raioMetros(), req.geofenceModes(),
                req.targetRole(), tenantAlvo, visibleTenants);
        String dedup = AlertaCooldownService.dedupKey("PZ", tenantAlvo, req.targetRole(),
                req.severidade(), req.titulo());
        boolean cooldown = cooldownService.isActive("PERSONALIZED", u.getTenant().getId(), dedup);
        return build(ids, cooldown);
    }

    @Transactional(readOnly = true)
    public AlertaPreviewDTO previewEscalation(EscalateAlertRequest req) {
        Set<UUID> ids = targetingService.targetEscalation(req.idTenantAlvo());
        return build(ids, false);
    }

    // --------------------------------------------------------------- helpers

    private AlertaPreviewDTO build(Set<UUID> ids, boolean cooldownAtivo) {
        if (ids.isEmpty()) {
            return new AlertaPreviewDTO(0, Map.of(), Map.of(), cooldownAtivo, null);
        }
        Map<String, Integer> porRole = new HashMap<>();
        Map<UUID, Integer> porTenant = new HashMap<>();
        // Carrega usuários em batch para o breakdown
        Iterable<Usuario> users = usuarioRepository.findAllById(ids);
        for (Usuario u : users) {
            porRole.merge(u.getRole().getRoleNome(), 1, Integer::sum);
            porTenant.merge(u.getTenant().getId(), 1, Integer::sum);
        }
        return new AlertaPreviewDTO(ids.size(), porRole, porTenant, cooldownAtivo, null);
    }
}
