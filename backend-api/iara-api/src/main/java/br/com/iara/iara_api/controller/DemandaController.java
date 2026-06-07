package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.*;
import br.com.iara.iara_api.service.DemandaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de demandas de PC.
 *
 * <p>Fase 4C: o @PreAuthorize foi relaxado para qualquer auth — o
 * {@code DemandaService.exigirCoordOuWorker(pc)} é a regra real de
 * autorização (coordenador OU worker confirmado/ativo do PC).</p>
 */
@RestController
@RequestMapping("/pontos-coleta/{pcId}/demandas")
@RequiredArgsConstructor
public class DemandaController {

    private final DemandaService service;

    @PostMapping
    public ResponseEntity<DemandaDTO> criar(@PathVariable UUID pcId,
                                            @Valid @RequestBody DemandaRequest req) {
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
    public DemandaDTO atualizar(@PathVariable UUID pcId, @PathVariable UUID demandaId,
                                @Valid @RequestBody UpdateDemandaRequest req) {
        return service.atualizar(pcId, demandaId, req);
    }

    /** Sub-fase 4C: encerramento manual da demanda (substitui semanticamente desativar). */
    @PatchMapping("/{demandaId}/fechar")
    public DemandaDTO fechar(@PathVariable UUID pcId, @PathVariable UUID demandaId) {
        return service.fechar(pcId, demandaId);
    }

    @PatchMapping("/{demandaId}/desativar")
    public DemandaDTO desativar(@PathVariable UUID pcId, @PathVariable UUID demandaId) {
        return service.desativar(pcId, demandaId);
    }
}
