package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.infra.InfraDTO;
import br.com.iara.iara_api.dto.infra.InfraRequest;
import br.com.iara.iara_api.service.InfraService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/infra-municipal")
@RequiredArgsConstructor
public class InfraController {

    private final InfraService service;

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<InfraDTO> criar(@Valid @RequestBody InfraRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<InfraDTO> listar(@RequestParam(required = false) String tipo) {
        return service.listar(tipo);
    }

    @GetMapping("/proximos")
    @PreAuthorize("hasRole('MONITOR')")
    public List<InfraDTO> proximos(@RequestParam(name = "id_evento") UUID idEvento,
                                   @RequestParam(name = "raio_metros", defaultValue = "30000") int raio) {
        return service.proximos(idEvento, raio);
    }

    @GetMapping("/{id}")
    public InfraDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public InfraDTO atualizar(@PathVariable UUID id, @Valid @RequestBody InfraRequest req) {
        return service.atualizar(id, req);
    }
}
