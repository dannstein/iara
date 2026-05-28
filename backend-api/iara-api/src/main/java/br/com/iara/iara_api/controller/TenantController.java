package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.tenant.*;
import br.com.iara.iara_api.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService service;

    @GetMapping
    @PreAuthorize("hasRole('GESTOR')")
    public List<TenantDTO> listarFilhos() {
        return service.listarFilhos();
    }

    @GetMapping("/hierarquia")
    @PreAuthorize("hasRole('GESTOR')")
    public TenantNodeDTO hierarquia() {
        return service.hierarquia();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public TenantDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<TenantDTO> criar(@Valid @RequestBody CreateTenantRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TenantDTO atualizar(@PathVariable UUID id, @Valid @RequestBody UpdateTenantRequest req) {
        return service.atualizar(id, req);
    }
}
