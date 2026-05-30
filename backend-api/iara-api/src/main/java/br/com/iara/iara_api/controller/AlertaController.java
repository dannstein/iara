package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.alerta.*;
import br.com.iara.iara_api.service.AlertaService;
import br.com.iara.iara_api.service.alert.AlertaPreviewService;
import br.com.iara.iara_api.service.alert.AlertaTemplates;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alertas")
@RequiredArgsConstructor
public class AlertaController {

    private final AlertaService service;
    private final AlertaPreviewService previewService;

    // ============================================================================
    // CREATE — 8 categorias + escalonamento
    // ============================================================================

    @PostMapping("/danger-zone")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarDangerZone(@Valid @RequestBody CreateDangerZoneAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarDangerZone(req));
    }

    @PostMapping("/event-zone")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarEventZone(@Valid @RequestBody CreateEventZoneAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarEventZone(req));
    }

    @PostMapping("/tenant-broadcast")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarTenantBroadcast(@Valid @RequestBody CreateTenantBroadcastRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarTenantBroadcast(req));
    }

    @PostMapping("/technical-request")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarTechnicalRequest(@Valid @RequestBody CreateTechnicalRequestAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarTechnicalRequest(req));
    }

    @PostMapping("/support-points")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarSupportPoints(@Valid @RequestBody CreateSupportPointsAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarSupportPoints(req));
    }

    @PostMapping("/collection-points")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarCollectionPoints(@Valid @RequestBody CreateCollectionPointsAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarCollectionPoints(req));
    }

    @PostMapping("/monitors")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarMonitors(@Valid @RequestBody CreateMonitorsAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarMonitors(req));
    }

    @PostMapping("/personalized")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> criarPersonalized(@Valid @RequestBody CreatePersonalizedAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarPersonalized(req));
    }

    @PostMapping("/escalonar")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> escalonar(@Valid @RequestBody EscalateAlertRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.escalonar(req));
    }

    // ============================================================================
    // PREVIEW — calcula destinatários sem persistir nem disparar (1F.2)
    // ============================================================================

    @PostMapping("/preview/danger-zone")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewDangerZone(@Valid @RequestBody CreateDangerZoneAlertRequest req) {
        return previewService.previewDangerZone(req);
    }

    @PostMapping("/preview/event-zone")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewEventZone(@Valid @RequestBody CreateEventZoneAlertRequest req) {
        return previewService.previewEventZone(req);
    }

    @PostMapping("/preview/tenant-broadcast")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewTenantBroadcast(@Valid @RequestBody CreateTenantBroadcastRequest req) {
        return previewService.previewTenantBroadcast(req);
    }

    @PostMapping("/preview/technical-request")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewTechnicalRequest(@Valid @RequestBody CreateTechnicalRequestAlertRequest req) {
        return previewService.previewTechnicalRequest(req);
    }

    @PostMapping("/preview/support-points")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewSupportPoints(@Valid @RequestBody CreateSupportPointsAlertRequest req) {
        return previewService.previewSupportPoints(req);
    }

    @PostMapping("/preview/collection-points")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewCollectionPoints(@Valid @RequestBody CreateCollectionPointsAlertRequest req) {
        return previewService.previewCollectionPoints(req);
    }

    @PostMapping("/preview/monitors")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewMonitors(@Valid @RequestBody CreateMonitorsAlertRequest req) {
        return previewService.previewMonitors(req);
    }

    @PostMapping("/preview/personalized")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewPersonalized(@Valid @RequestBody CreatePersonalizedAlertRequest req) {
        return previewService.previewPersonalized(req);
    }

    @PostMapping("/preview/escalonar")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaPreviewDTO previewEscalation(@Valid @RequestBody EscalateAlertRequest req) {
        return previewService.previewEscalation(req);
    }

    // ============================================================================
    // TEMPLATES — biblioteca padrão de mensagens por categoria (1F.4)
    // ============================================================================

    @GetMapping("/templates/{categoria}")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaTemplateDTO template(@PathVariable String categoria) {
        AlertaTemplates.Template t = AlertaTemplates.forCategoria(categoria);
        return new AlertaTemplateDTO(categoria, t.titulo(), t.mensagem(), t.placeholders());
    }

    // ============================================================================
    // READ / MANAGEMENT
    // ============================================================================

    @GetMapping
    public List<AlertaDTO> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severidade,
            @RequestParam(required = false) String categoria,
            @RequestParam(name = "id_evento", required = false) UUID idEvento,
            @RequestParam(name = "id_zona_risco", required = false) UUID idZonaRisco
    ) {
        return service.listar(status, severidade, categoria, idEvento, idZonaRisco);
    }

    @GetMapping("/geofencing")
    public List<AlertaDTO> geofencing(@RequestParam double lat, @RequestParam double lng) {
        return service.geofencing(lat, lng);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('MONITOR')")
    public AlertaDashboardDTO dashboard() {
        return service.dashboard();
    }

    @GetMapping("/{id}")
    public AlertaDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @GetMapping("/{id}/destinatarios")
    @PreAuthorize("hasRole('GESTOR')")
    public List<AlertaDestinatarioDTO> destinatarios(
            @PathVariable UUID id,
            @RequestParam(required = false) String status
    ) {
        return service.listarDestinatarios(id, status);
    }

    @PatchMapping("/{id}/resolver")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaDTO resolver(@PathVariable UUID id) {
        return service.resolver(id);
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaDTO cancelar(@PathVariable UUID id) {
        return service.cancelar(id);
    }

    @PatchMapping("/{id}/visualizar")
    public AlertaDestinatarioDTO visualizar(@PathVariable UUID id) {
        return service.visualizar(id);
    }

    @PatchMapping("/{id}/ack")
    public AlertaDestinatarioDTO ack(@PathVariable UUID id, @Valid @RequestBody AckRequest req) {
        return service.ack(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletar(@PathVariable UUID id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
