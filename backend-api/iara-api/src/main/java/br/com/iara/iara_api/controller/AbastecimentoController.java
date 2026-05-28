package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.recurso.AbastecimentoDTO;
import br.com.iara.iara_api.dto.recurso.AbastecimentoRequest;
import br.com.iara.iara_api.service.AbastecimentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/abastecimento")
@RequiredArgsConstructor
public class AbastecimentoController {

    private final AbastecimentoService service;

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AbastecimentoDTO> criar(@Valid @RequestBody AbastecimentoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    @PreAuthorize("hasRole('GESTOR')")
    public List<AbastecimentoDTO> listar() {
        return service.listar();
    }

    @GetMapping("/proximos")
    @PreAuthorize("hasRole('TECNICO')")
    public List<AbastecimentoDTO> proximos(@RequestParam double lat, @RequestParam double lng,
                                           @RequestParam(name = "raio_metros", defaultValue = "30000") int raio,
                                           @RequestParam(required = false) String tipo) {
        return service.proximos(lat, lng, raio, tipo);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public AbastecimentoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public AbastecimentoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody AbastecimentoRequest req) {
        return service.atualizar(id, req);
    }
}
