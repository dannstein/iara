package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.alerta.AlertaAgendadoDTO;
import br.com.iara.iara_api.dto.alerta.CreateAlertaAgendadoRequest;
import br.com.iara.iara_api.service.alert.AlertaAgendamentoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/alertas/agendamentos")
@RequiredArgsConstructor
public class AlertaAgendamentoController {

    private final AlertaAgendamentoService service;

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<AlertaAgendadoDTO> criar(@Valid @RequestBody CreateAlertaAgendadoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    @PreAuthorize("hasRole('GESTOR')")
    public List<AlertaAgendadoDTO> listar(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(required = false) String categoria
    ) {
        return service.listar(ativo, categoria);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaAgendadoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaAgendadoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody CreateAlertaAgendadoRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/ativar")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaAgendadoDTO ativar(@PathVariable UUID id) {
        return service.ativar(id);
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasRole('GESTOR')")
    public AlertaAgendadoDTO desativar(@PathVariable UUID id) {
        return service.desativar(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<Void> remover(@PathVariable UUID id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
