package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.ApoioDTO;
import br.com.iara.iara_api.dto.evento.ApoioRequest;
import br.com.iara.iara_api.service.ApoioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/eventos/{eventoId}/apoio")
@RequiredArgsConstructor
public class ApoioController {

    private final ApoioService service;

    @PostMapping
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<ApoioDTO> abrir(@PathVariable UUID eventoId, @Valid @RequestBody ApoioRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.abrir(eventoId, req));
    }

    @GetMapping
    @PreAuthorize("hasRole('MONITOR')")
    public List<ApoioDTO> listar(@PathVariable UUID eventoId) {
        return service.listar(eventoId);
    }

    @PatchMapping("/{apoioId}/assumir")
    @PreAuthorize("hasRole('GESTOR')")
    public ApoioDTO assumir(@PathVariable UUID eventoId, @PathVariable UUID apoioId) {
        return service.assumir(eventoId, apoioId);
    }

    @PatchMapping("/{apoioId}/encerrar")
    @PreAuthorize("hasRole('GESTOR')")
    public ApoioDTO encerrar(@PathVariable UUID eventoId, @PathVariable UUID apoioId) {
        return service.encerrar(eventoId, apoioId);
    }
}
