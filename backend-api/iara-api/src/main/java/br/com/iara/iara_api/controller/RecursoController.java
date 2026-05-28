package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.dto.recurso.*;
import br.com.iara.iara_api.service.RecursoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class RecursoController {

    private final RecursoService service;

    // ---- 18.1 catálogo ----

    @PostMapping("/recursos")
    public ResponseEntity<RecursoDTO> criar(@Valid @RequestBody RecursoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping("/recursos")
    public List<RecursoDTO> listar(@RequestParam(required = false) String status,
                                   @RequestParam(name = "id_tipo", required = false) UUID tipoId) {
        return service.listar(status, tipoId);
    }

    @GetMapping("/recursos/disponiveis")
    public List<RecursoDTO> disponiveis(@RequestParam(name = "id_evento") UUID idEvento,
                                        @RequestParam(name = "raio_metros", defaultValue = "50000") int raio) {
        return service.disponiveis(idEvento, raio);
    }

    @GetMapping("/recursos/{id}")
    public RecursoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/recursos/{id}")
    public RecursoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody RecursoRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/recursos/{id}/localizacao")
    public RecursoDTO localizacao(@PathVariable UUID id, @Valid @RequestBody CoordenadasDTO coords) {
        return service.atualizarLocalizacao(id, coords);
    }

    // ---- 18.2 alocação em eventos ----

    @PostMapping("/eventos/{eventoId}/recursos")
    public ResponseEntity<RecursoEventoDTO> alocar(@PathVariable UUID eventoId,
                                                   @Valid @RequestBody AlocarRecursoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.alocar(eventoId, req));
    }

    @GetMapping("/eventos/{eventoId}/recursos")
    public List<RecursoEventoDTO> alocados(@PathVariable UUID eventoId) {
        return service.alocados(eventoId);
    }

    @PatchMapping("/eventos/{eventoId}/recursos/{recursoId}/liberar")
    public RecursoEventoDTO liberar(@PathVariable UUID eventoId, @PathVariable UUID recursoId) {
        return service.liberar(eventoId, recursoId);
    }
}
