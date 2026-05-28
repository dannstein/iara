package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.hospital.HospitalDTO;
import br.com.iara.iara_api.dto.hospital.HospitalRequest;
import br.com.iara.iara_api.service.HospitalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/hospitais")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService service;

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<HospitalDTO> criar(@Valid @RequestBody HospitalRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<HospitalDTO> listar() {
        return service.listar();
    }

    @GetMapping("/proximos")
    @PreAuthorize("hasRole('MONITOR')")
    public List<HospitalDTO> proximos(@RequestParam double lat, @RequestParam double lng,
                                      @RequestParam(name = "raio_metros", defaultValue = "30000") int raio) {
        return service.proximos(lat, lng, raio);
    }

    @GetMapping("/{id}")
    public HospitalDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public HospitalDTO atualizar(@PathVariable UUID id, @Valid @RequestBody HospitalRequest req) {
        return service.atualizar(id, req);
    }
}
