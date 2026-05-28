package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.*;
import br.com.iara.iara_api.service.IncidenteService;
import br.com.iara.iara_api.service.TriagemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/eventos/{eventoId}")
@RequiredArgsConstructor
public class IncidenteController {

    private final IncidenteService incidenteService;
    private final TriagemService triagemService;

    // ---- 8.1 incidentes (números gerais) ----

    @PostMapping("/incidentes")
    @PreAuthorize("hasRole('MONITOR')")
    public ResponseEntity<IncidentesDTO> registrarIncidentes(@PathVariable UUID eventoId,
                                                             @Valid @RequestBody IncidentesRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(incidenteService.registrar(eventoId, req));
    }

    @GetMapping("/incidentes")
    @PreAuthorize("hasRole('MONITOR')")
    public List<IncidentesDTO> historicoIncidentes(@PathVariable UUID eventoId) {
        return incidenteService.historico(eventoId);
    }

    @GetMapping("/incidentes/atual")
    @PreAuthorize("hasRole('MONITOR')")
    public IncidentesDTO incidentesAtual(@PathVariable UUID eventoId) {
        return incidenteService.atual(eventoId);
    }

    // ---- 8.2 triagem START individual ----

    @PostMapping("/triagem")
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<TriagemDTO> registrarTriagem(@PathVariable UUID eventoId,
                                                       @Valid @RequestBody TriagemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(triagemService.registrar(eventoId, req));
    }

    @GetMapping("/triagem")
    @PreAuthorize("hasRole('MONITOR')")
    public List<TriagemDTO> estadoAtualTriagem(@PathVariable UUID eventoId) {
        return triagemService.estadoAtual(eventoId);
    }

    @GetMapping("/triagem/{codigoCampo}")
    @PreAuthorize("hasRole('MONITOR')")
    public List<TriagemDTO> historicoVitima(@PathVariable UUID eventoId, @PathVariable String codigoCampo) {
        return triagemService.historicoVitima(eventoId, codigoCampo);
    }
}
