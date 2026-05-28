package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.abrigo.AbrigoDTO;
import br.com.iara.iara_api.dto.abrigo.AbrigoRequest;
import br.com.iara.iara_api.dto.abrigo.OcupanteDTO;
import br.com.iara.iara_api.dto.abrigo.OcupanteRequest;
import br.com.iara.iara_api.service.AbrigoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/abrigos")
@RequiredArgsConstructor
public class AbrigoController {

    private final AbrigoService service;

    @PostMapping
    @PreAuthorize("hasRole('MONITOR')")
    public ResponseEntity<AbrigoDTO> criar(@Valid @RequestBody AbrigoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<AbrigoDTO> listar(@RequestParam(name = "is_active", required = false) Boolean isActive,
                                  @RequestParam(name = "id_evento", required = false) UUID idEvento) {
        return service.listar(isActive, idEvento);
    }

    @GetMapping("/proximos")
    @PreAuthorize("hasRole('MONITOR')")
    public List<AbrigoDTO> proximos(@RequestParam(name = "id_evento") UUID idEvento,
                                    @RequestParam(name = "raio_metros", defaultValue = "20000") int raio) {
        return service.proximos(idEvento, raio);
    }

    @GetMapping("/{id}")
    public AbrigoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MONITOR')")
    public AbrigoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody AbrigoRequest req) {
        return service.atualizar(id, req);
    }

    // ---- 15.1 ocupantes ----

    @PostMapping("/{id}/ocupantes")
    @PreAuthorize("hasRole('MONITOR')")
    public ResponseEntity<OcupanteDTO> registrar(@PathVariable UUID id, @Valid @RequestBody OcupanteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrarOcupante(id, req));
    }

    @GetMapping("/{id}/ocupantes")
    @PreAuthorize("hasRole('MONITOR')")
    public List<OcupanteDTO> ocupantes(@PathVariable UUID id,
                                       @RequestParam(name = "is_prioridade", required = false) Boolean isPrioridade) {
        return service.listarOcupantes(id, isPrioridade);
    }

    @GetMapping("/{id}/ocupantes/prioritarios")
    @PreAuthorize("hasRole('MONITOR')")
    public List<OcupanteDTO> prioritarios(@PathVariable UUID id) {
        return service.listarOcupantes(id, true);
    }

    @PatchMapping("/{id}/ocupantes/{ocupanteId}")
    @PreAuthorize("hasRole('MONITOR')")
    public OcupanteDTO atualizarOcupante(@PathVariable UUID id, @PathVariable UUID ocupanteId,
                                         @Valid @RequestBody OcupanteRequest req) {
        return service.atualizarOcupante(id, ocupanteId, req);
    }

    @PatchMapping("/{id}/ocupantes/{ocupanteId}/saida")
    @PreAuthorize("hasRole('MONITOR')")
    public OcupanteDTO saida(@PathVariable UUID id, @PathVariable UUID ocupanteId) {
        return service.registrarSaida(id, ocupanteId);
    }
}
