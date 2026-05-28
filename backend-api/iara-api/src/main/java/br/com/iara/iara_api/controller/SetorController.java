package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.SetorDTO;
import br.com.iara.iara_api.dto.evento.SetorRequest;
import br.com.iara.iara_api.service.SetorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/eventos/{eventoId}/setores")
@RequiredArgsConstructor
public class SetorController {

    private final SetorService service;

    @PostMapping
    @PreAuthorize("hasRole('MONITOR')")
    public ResponseEntity<SetorDTO> definir(@PathVariable UUID eventoId, @Valid @RequestBody SetorRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.definir(eventoId, req));
    }

    @GetMapping
    public List<SetorDTO> listar(@PathVariable UUID eventoId) {
        return service.listar(eventoId);
    }

    @GetMapping("/verificar")
    public Map<String, String> verificar(@PathVariable UUID eventoId,
                                         @RequestParam double lat, @RequestParam double lng) {
        return service.verificar(eventoId, lat, lng);
    }

    @PutMapping("/{tipo}")
    @PreAuthorize("hasRole('MONITOR')")
    public SetorDTO atualizar(@PathVariable UUID eventoId, @PathVariable String tipo,
                              @Valid @RequestBody SetorRequest req) {
        return service.atualizar(eventoId, tipo, req);
    }

    @DeleteMapping("/{tipo}")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<Void> remover(@PathVariable UUID eventoId, @PathVariable String tipo) {
        service.remover(eventoId, tipo);
        return ResponseEntity.noContent().build();
    }
}
