package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.ResponderDisponibilidadeRequest;
import br.com.iara.iara_api.dto.pc.WorkerDisponibilidadeDTO;
import br.com.iara.iara_api.service.PcEventoLifecycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints da fila pessoal de disponibilidades do worker (sub-fase 4B).
 * Worker é qualquer usuário com {@code Helper(status=CONFIRMADO,isActive=true)}
 * vinculado a um PC; o role não é importante.
 */
@RestController
@RequestMapping("/worker/evento-disponibilidade")
@RequiredArgsConstructor
public class WorkerDisponibilidadeController {

    private final PcEventoLifecycleService service;

    @GetMapping
    public List<WorkerDisponibilidadeDTO> minhaFila(@RequestParam(required = false) String status) {
        return service.minhaFila(status);
    }

    @PatchMapping("/{id}/confirmar")
    public WorkerDisponibilidadeDTO confirmar(@PathVariable UUID id) {
        return service.confirmar(id);
    }

    @PatchMapping("/{id}/recusar")
    public WorkerDisponibilidadeDTO recusar(@PathVariable UUID id,
                                            @Valid @RequestBody(required = false) ResponderDisponibilidadeRequest req) {
        return service.recusarDisponibilidade(id, req);
    }
}
