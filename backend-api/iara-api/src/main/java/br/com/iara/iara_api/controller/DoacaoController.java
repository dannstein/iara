package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.*;
import br.com.iara.iara_api.service.DoacaoService;
import br.com.iara.iara_api.service.PcService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Endpoints de doação (sub-fase 4D).
 *
 * <p>O fluxo é: doador cria intenção → coord/worker marca recebido (parcial
 * permitido) → atualiza estoque + status da demanda automaticamente. Cada
 * mudança gera linha em {@code iara_inventory_transaction} (append-only).</p>
 */
@RestController
@RequiredArgsConstructor
public class DoacaoController {

    private final DoacaoService service;
    private final PcService pcService;

    // ---- doador ----

    @PostMapping("/doacoes")
    public ResponseEntity<DoacaoDTO> criar(@Valid @RequestBody CreateDoacaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping("/doacoes/minhas")
    public List<DoacaoDTO> minhas() {
        return service.minhas();
    }

    @PatchMapping("/doacoes/{id}/cancelar")
    public DoacaoDTO cancelar(@PathVariable UUID id) {
        return service.cancelar(id);
    }

    // ---- coordenador / worker ----

    @GetMapping("/pontos-coleta/{pcId}/doacoes")
    public List<DoacaoDTO> pendentesDoPc(@PathVariable UUID pcId) {
        return service.pendentesDoPc(pcId);
    }

    @PatchMapping("/doacoes/{id}/receber")
    public DoacaoDTO receber(@PathVariable UUID id,
                             @Valid @RequestBody MarcarRecebidaRequest req) {
        return service.marcarRecebida(id, req.qtdRecebida());
    }

    @PostMapping("/pontos-coleta/{pcId}/estoque/distribuir")
    public ResponseEntity<Void> distribuir(@PathVariable UUID pcId,
                                           @Valid @RequestBody DistribuirRequest req) {
        service.distribuir(pcId, req.idTipo(), req.quantidade(), req.observacao());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/pontos-coleta/{pcId}/estoque/ajustar")
    public ResponseEntity<Void> ajustar(@PathVariable UUID pcId,
                                        @Valid @RequestBody AjustarEstoqueRequest req) {
        service.ajustar(pcId, req.idTipo(), req.delta(), req.observacao());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/pontos-coleta/{pcId}/inventario/transacoes")
    @PreAuthorize("hasAnyRole('COORDENADOR','GESTOR','ADMIN')")
    public List<InventoryTransactionDTO> historicoInventario(
            @PathVariable UUID pcId,
            @RequestParam(name = "id_evento", required = false) UUID eventoId) {
        return pcService.listarTransacoes(pcId, eventoId);
    }
}
