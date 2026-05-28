package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.AlertaDTO;
import br.com.iara.iara_api.dto.evento.CreateAlertaRequest;
import br.com.iara.iara_api.service.AlertaService;
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

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaDTO> emitir(@Valid @RequestBody CreateAlertaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.emitir(req));
    }

    @GetMapping
    public List<AlertaDTO> listar() {
        return service.listar();
    }

    @GetMapping("/geofencing")
    public List<AlertaDTO> geofencing(@RequestParam double lat, @RequestParam double lng) {
        return service.geofencing(lat, lng);
    }

    @GetMapping("/{id}")
    public AlertaDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<Void> encerrar(@PathVariable UUID id) {
        service.encerrar(id);
        return ResponseEntity.noContent().build();
    }
}
