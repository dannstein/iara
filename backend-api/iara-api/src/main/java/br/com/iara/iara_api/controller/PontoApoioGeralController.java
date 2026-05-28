package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.apoio.PontoApoioGeralDTO;
import br.com.iara.iara_api.dto.apoio.PontoApoioGeralRequest;
import br.com.iara.iara_api.service.PontoApoioGeralService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/pontos-apoio")
@RequiredArgsConstructor
public class PontoApoioGeralController {

    private final PontoApoioGeralService service;

    @GetMapping
    public List<PontoApoioGeralDTO> listar(@RequestParam(required = false) Boolean livre) {
        return service.listar(livre);
    }

    @GetMapping("/{id}")
    public PontoApoioGeralDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<PontoApoioGeralDTO> criar(@Valid @RequestBody PontoApoioGeralRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasRole('GESTOR')")
    public PontoApoioGeralDTO desativar(@PathVariable UUID id) {
        return service.desativar(id);
    }
}
