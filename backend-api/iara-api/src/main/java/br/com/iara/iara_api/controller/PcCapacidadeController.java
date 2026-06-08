package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.CapacidadeDTO;
import br.com.iara.iara_api.dto.pc.UpsertCapacidadeRequest;
import br.com.iara.iara_api.service.DemandaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Capacidade máxima por (PC, tipo de demanda) — sub-fase 4C.
 * Coordenador OU worker confirmado do PC podem editar.
 */
@RestController
@RequestMapping("/pontos-coleta/{pcId}/capacidades")
@RequiredArgsConstructor
public class PcCapacidadeController {

    private final DemandaService service;

    @GetMapping
    public List<CapacidadeDTO> listar(@PathVariable UUID pcId) {
        return service.listarCapacidades(pcId);
    }

    @PutMapping("/{tipoId}")
    public CapacidadeDTO upsert(@PathVariable UUID pcId,
                                @PathVariable UUID tipoId,
                                @Valid @RequestBody UpsertCapacidadeRequest req) {
        return service.upsertCapacidade(pcId, tipoId, req.qtdMaxima());
    }
}
