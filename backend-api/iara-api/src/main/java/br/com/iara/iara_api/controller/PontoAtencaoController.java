package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.atencao.*;
import br.com.iara.iara_api.service.PontoAtencaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/pontos-atencao")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class PontoAtencaoController {

    private final PontoAtencaoService service;

    @PostMapping
    public ResponseEntity<PontoAtencaoDTO> criar(@Valid @RequestBody PontoAtencaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<PontoAtencaoDTO> listar(@RequestParam(name = "is_active", required = false) Boolean isActive,
                                        @RequestParam(name = "is_industrial", required = false) Boolean isIndustrial,
                                        @RequestParam(name = "situacao_apoio", required = false) String situacaoApoio) {
        return service.listar(isActive, isIndustrial, situacaoApoio);
    }

    @GetMapping("/proximos")
    public List<PontoAtencaoDTO> proximos(@RequestParam double lat, @RequestParam double lng,
                                          @RequestParam(name = "raio_metros", defaultValue = "10000") int raio) {
        return service.proximos(lat, lng, raio);
    }

    @GetMapping("/sem-apoio")
    public List<PontoAtencaoDTO> semApoio() {
        return service.semApoio();
    }

    @GetMapping("/industriais")
    public List<PontoAtencaoDTO> industriais() {
        return service.industriais();
    }

    @GetMapping("/{id}")
    public PontoAtencaoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    public PontoAtencaoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody PontoAtencaoRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/desativar")
    public PontoAtencaoDTO desativar(@PathVariable UUID id) {
        return service.desativar(id);
    }

    // ---- 20.1 apoios (RN21) ----

    @PostMapping("/{id}/apoios")
    public ResponseEntity<ApoioVinculoDTO> vincularApoio(@PathVariable UUID id,
                                                         @RequestBody ApoioVinculoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.vincularApoio(id, req));
    }

    @GetMapping("/{id}/apoios")
    public List<ApoioVinculoDTO> listarApoios(@PathVariable UUID id) {
        return service.listarApoios(id);
    }

    @DeleteMapping("/{id}/apoios/{apoioId}")
    public ResponseEntity<Void> removerApoio(@PathVariable UUID id, @PathVariable UUID apoioId) {
        service.removerApoio(id, apoioId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/apoios/especifico")
    public ResponseEntity<ApoioVinculoDTO> apoioEspecifico(@PathVariable UUID id,
                                                           @Valid @RequestBody PontoApoioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarApoioEspecifico(id, req));
    }

    // ---- 20.2 desastres (RN22) ----

    @PostMapping("/{id}/desastres")
    public ResponseEntity<DesastreVinculoDTO> vincularDesastre(@PathVariable UUID id,
                                                               @RequestBody Map<String, String> body) {
        UUID desastreTipoId = UUID.fromString(body.get("idDesastreTipo"));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.vincularDesastre(id, desastreTipoId, body.get("observacao")));
    }

    @GetMapping("/{id}/desastres")
    public List<DesastreVinculoDTO> listarDesastres(@PathVariable UUID id) {
        return service.listarDesastres(id);
    }

    @DeleteMapping("/{id}/desastres/{desastreTipoId}")
    public ResponseEntity<Void> removerDesastre(@PathVariable UUID id, @PathVariable UUID desastreTipoId) {
        service.removerDesastre(id, desastreTipoId);
        return ResponseEntity.noContent().build();
    }
}
