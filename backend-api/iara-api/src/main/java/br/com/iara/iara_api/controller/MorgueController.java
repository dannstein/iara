package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.MorgueDTO;
import br.com.iara.iara_api.dto.evento.MorgueRequest;
import br.com.iara.iara_api.dto.evento.MorgueUpdateRequest;
import br.com.iara.iara_api.service.MorgueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/eventos/{eventoId}/morgue")
@PreAuthorize("hasRole('MONITOR')")
@RequiredArgsConstructor
public class MorgueController {

    private final MorgueService service;

    @PostMapping
    public ResponseEntity<MorgueDTO> registrar(@PathVariable UUID eventoId,
                                               @Valid @RequestBody MorgueRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.registrar(eventoId, req));
    }

    @GetMapping
    public List<MorgueDTO> listar(@PathVariable UUID eventoId) {
        return service.listar(eventoId);
    }

    @GetMapping("/{codigoMorgue}")
    public MorgueDTO detalhar(@PathVariable UUID eventoId, @PathVariable String codigoMorgue) {
        return service.detalhar(eventoId, codigoMorgue);
    }

    @PatchMapping("/{codigoMorgue}")
    public MorgueDTO atualizar(@PathVariable UUID eventoId, @PathVariable String codigoMorgue,
                               @Valid @RequestBody MorgueUpdateRequest req) {
        return service.atualizar(eventoId, codigoMorgue, req);
    }
}
