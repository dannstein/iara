package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.DemandaDTO;
import br.com.iara.iara_api.dto.pc.DemandaRequest;
import br.com.iara.iara_api.dto.pc.UpdateDemandaRequest;
import br.com.iara.iara_api.service.DemandaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pontos-coleta/{pcId}/demandas")
@RequiredArgsConstructor
public class DemandaController {

    private final DemandaService service;

    @PostMapping
    @PreAuthorize("hasRole('COORDENADOR')")
    public ResponseEntity<DemandaDTO> criar(@PathVariable UUID pcId, @Valid @RequestBody DemandaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(pcId, req));
    }

    @GetMapping
    public List<DemandaDTO> listar(@PathVariable UUID pcId,
                                   @RequestParam(name = "is_active", required = false) Boolean isActive,
                                   @RequestParam(required = false) String prioridade,
                                   @RequestParam(name = "id_evento", required = false) UUID eventoId) {
        return service.listar(pcId, isActive, prioridade, eventoId);
    }

    @PutMapping("/{demandaId}")
    @PreAuthorize("hasRole('COORDENADOR')")
    public DemandaDTO atualizar(@PathVariable UUID pcId, @PathVariable UUID demandaId,
                                @Valid @RequestBody UpdateDemandaRequest req) {
        return service.atualizar(pcId, demandaId, req);
    }

    @PatchMapping("/{demandaId}/desativar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public DemandaDTO desativar(@PathVariable UUID pcId, @PathVariable UUID demandaId) {
        return service.desativar(pcId, demandaId);
    }
}
