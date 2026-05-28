package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.ConfirmarDoacaoRequest;
import br.com.iara.iara_api.dto.pc.CreateDoacaoRequest;
import br.com.iara.iara_api.dto.pc.DoacaoDTO;
import br.com.iara.iara_api.service.DoacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DoacaoController {

    private final DoacaoService service;

    @PostMapping("/doacoes")
    @PreAuthorize("hasRole('DOADOR')")
    public ResponseEntity<DoacaoDTO> criar(@Valid @RequestBody CreateDoacaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping("/doacoes/minhas")
    @PreAuthorize("hasRole('DOADOR')")
    public List<DoacaoDTO> minhas() {
        return service.minhas();
    }

    @PatchMapping("/doacoes/{id}/cancelar")
    @PreAuthorize("hasRole('DOADOR')")
    public DoacaoDTO cancelar(@PathVariable UUID id) {
        return service.cancelar(id);
    }

    @GetMapping("/pontos-coleta/{pcId}/doacoes")
    @PreAuthorize("hasRole('COORDENADOR')")
    public List<DoacaoDTO> pendentesDoPc(@PathVariable UUID pcId) {
        return service.pendentesDoPc(pcId);
    }

    @PatchMapping("/doacoes/{id}/confirmar")
    @PreAuthorize("hasRole('COORDENADOR')")
    public DoacaoDTO confirmar(@PathVariable UUID id, @RequestBody(required = false) ConfirmarDoacaoRequest req) {
        return service.confirmar(id, req != null ? req.idUsuConfirmou() : null);
    }
}
