package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.*;
import br.com.iara.iara_api.service.PcService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pontos-coleta")
@RequiredArgsConstructor
public class PcController {

    private final PcService service;
    private final br.com.iara.iara_api.service.PcEventoLifecycleService lifecycleService;

    // ---- 13.1 CRUD ----

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDENADOR','GESTOR','ADMIN')")
    public ResponseEntity<PcDTO> criar(@Valid @RequestBody CreatePcRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<PcDTO> listar(@RequestParam(name = "is_active", required = false) Boolean isActive,
                              @RequestParam(name = "pc_is_verified", required = false) Boolean isVerified,
                              @RequestParam(name = "pc_tipo", required = false) String pcTipo,
                              @RequestParam(name = "status_verificacao", required = false) String statusVerificacao) {
        return service.listar(isActive, isVerified, pcTipo, statusVerificacao);
    }

    @GetMapping("/proximos")
    public List<PcDTO> proximos(@RequestParam double lat, @RequestParam double lng,
                                @RequestParam(name = "raio_metros", defaultValue = "5000") int raioMetros) {
        return service.proximos(lat, lng, raioMetros);
    }

    @GetMapping("/{id}")
    public PcDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COORDENADOR')")
    public PcDTO atualizar(@PathVariable UUID id, @Valid @RequestBody UpdatePcRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/verificar")
    @PreAuthorize("hasRole('GESTOR')")
    public PcDTO verificar(@PathVariable UUID id,
                           @Valid @RequestBody(required = false) VerificarPcRequest req) {
        return service.verificar(id, req);
    }

    @PatchMapping("/{id}/coordenador")
    @PreAuthorize("hasRole('GESTOR')")
    public PcDTO definirCoordenador(@PathVariable UUID id,
                                    @Valid @RequestBody DefinirCoordenadorRequest req) {
        return service.definirCoordenador(id, req.idUsuario());
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public PcDTO desativar(@PathVariable UUID id) {
        return service.desativar(id);
    }

    // ---- 13.2 vínculo PC ↔ evento ----

    @GetMapping("/{id}/eventos")
    @PreAuthorize("hasRole('COORDENADOR')")
    public List<PcEventoDTO> eventos(@PathVariable UUID id) {
        return service.eventosDoPc(id);
    }

    @PatchMapping("/{id}/eventos/{eventoId}/aceitar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public PcEventoDTO aceitar(@PathVariable UUID id, @PathVariable UUID eventoId) {
        // Sub-fase 4B: aceita + faz fan-out de disponibilidade pros workers.
        return lifecycleService.aceitar(id, eventoId);
    }

    @PatchMapping("/{id}/eventos/{eventoId}/recusar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public PcEventoDTO recusar(@PathVariable UUID id, @PathVariable UUID eventoId,
                               @Valid @RequestBody RecusarPcEventoRequest req) {
        return lifecycleService.recusar(id, eventoId, req);
    }

    /** Catálogo público (autenticado) de motivos para uso na UI. */
    @GetMapping("/motivos-recusa")
    public List<MotivoRecusaDTO> motivosRecusa() {
        return lifecycleService.listarMotivos();
    }

    /** Workforce (workers + status) de um PC para um evento — visão do coordenador. */
    @GetMapping("/{id}/eventos/{eventoId}/workforce")
    @PreAuthorize("hasAnyRole('COORDENADOR','GESTOR','ADMIN')")
    public List<WorkerDisponibilidadeDTO> workforce(@PathVariable UUID id, @PathVariable UUID eventoId) {
        return lifecycleService.workforce(id, eventoId);
    }

    // ---- 13.4 estoque ----

    @GetMapping("/{id}/estoque")
    public List<EstoqueDTO> estoque(@PathVariable UUID id) {
        return service.estoque(id);
    }

    @PatchMapping("/{id}/estoque/{tipoId}")
    @PreAuthorize("hasRole('COORDENADOR')")
    public EstoqueDTO atualizarEstoque(@PathVariable UUID id, @PathVariable UUID tipoId,
                                       @RequestParam int quantidade) {
        return service.atualizarEstoque(id, tipoId, quantidade);
    }

    // ---- 13.5 helpers ----

    @PostMapping("/{id}/helpers/convidar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public ResponseEntity<HelperDTO> convidar(@PathVariable UUID id, @RequestParam UUID idUsuario) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.convidar(id, idUsuario));
    }

    // Fase 4B — worker = qualquer role (a regra real está na ownership do helper).
    @PostMapping("/{id}/helpers/solicitar")
    public ResponseEntity<HelperDTO> solicitar(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.solicitar(id));
    }

    @GetMapping("/{id}/helpers")
    @PreAuthorize("hasRole('COORDENADOR')")
    public List<HelperDTO> helpers(@PathVariable UUID id, @RequestParam(required = false) String status) {
        return service.listarHelpers(id, status);
    }

    @PatchMapping("/{id}/helpers/{helperId}/confirmar")
    public HelperDTO confirmarHelper(@PathVariable UUID id, @PathVariable UUID helperId) {
        return service.confirmarHelper(id, helperId);
    }

    @PatchMapping("/{id}/helpers/{helperId}/recusar")
    public HelperDTO recusarHelper(@PathVariable UUID id, @PathVariable UUID helperId) {
        return service.recusarHelper(id, helperId);
    }

    @PatchMapping("/{id}/helpers/{helperId}/encerrar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public HelperDTO encerrarHelper(@PathVariable UUID id, @PathVariable UUID helperId) {
        return service.encerrarHelper(id, helperId);
    }
}
