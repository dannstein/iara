package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.meteorologia.EstacaoDTO;
import br.com.iara.iara_api.dto.meteorologia.EstacaoRequest;
import br.com.iara.iara_api.dto.meteorologia.MedicaoDTO;
import br.com.iara.iara_api.service.EstacaoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/estacoes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class MeteorologiaController {

    private final EstacaoService service;

    @PostMapping
    public ResponseEntity<EstacaoDTO> criar(@Valid @RequestBody EstacaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<EstacaoDTO> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public EstacaoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @GetMapping("/{id}/medicoes")
    public List<MedicaoDTO> medicoes(@PathVariable UUID id,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "50") int size) {
        return service.medicoes(id, page, size);
    }

    @GetMapping("/{id}/medicoes/ultima")
    @PreAuthorize("hasRole('MONITOR')")
    public MedicaoDTO ultima(@PathVariable UUID id) {
        return service.ultimaMedicao(id);
    }
}
