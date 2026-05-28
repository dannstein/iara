package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.espec.*;
import br.com.iara.iara_api.service.EspecialidadeService;
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
public class EspecialidadeController {

    private final EspecialidadeService service;

    @GetMapping("/especialidades/categorias")
    public List<CategoriaDTO> listarCategorias() {
        return service.listarCategorias();
    }

    @GetMapping("/especialidades/categorias/{id}")
    public CategoriaDTO detalharCategoria(@PathVariable UUID id) {
        return service.detalharCategoria(id);
    }

    @PostMapping("/especialidades/categorias")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<CategoriaDTO> criarCategoria(@Valid @RequestBody CreateCategoriaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarCategoria(req));
    }

    @GetMapping("/especialidades")
    public List<EspecDTO> listarEspecs(@RequestParam(name = "id_categoria", required = false) UUID idCategoria) {
        return service.listarEspecs(idCategoria);
    }

    @PostMapping("/especialidades")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<EspecDTO> criarEspec(@Valid @RequestBody CreateEspecRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarEspec(req));
    }
}
