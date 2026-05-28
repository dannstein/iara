package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.zona.VincularApoioRequest;
import br.com.iara.iara_api.dto.zona.ZonaRiscoDTO;
import br.com.iara.iara_api.dto.zona.ZonaRiscoRequest;
import br.com.iara.iara_api.service.ZonaRiscoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/zonas-risco")
@RequiredArgsConstructor
public class ZonaRiscoController {

    private final ZonaRiscoService service;

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<ZonaRiscoDTO> criar(@Valid @RequestBody ZonaRiscoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<ZonaRiscoDTO> listar() {
        return service.listar();
    }

    @GetMapping("/geofencing")
    public List<ZonaRiscoDTO> geofencing(@RequestParam double lat, @RequestParam double lng) {
        return service.geofencing(lat, lng);
    }

    @GetMapping("/proximas")
    @PreAuthorize("hasRole('GESTOR')")
    public List<ZonaRiscoDTO> proximas(@RequestParam double lat, @RequestParam double lng,
                                       @RequestParam(name = "raio_metros", defaultValue = "10000") int raio) {
        return service.proximas(lat, lng, raio);
    }

    @GetMapping("/{id}")
    public ZonaRiscoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public ZonaRiscoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody ZonaRiscoRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/desativar")
    @PreAuthorize("hasRole('GESTOR')")
    public ZonaRiscoDTO desativar(@PathVariable UUID id) {
        return service.desativar(id);
    }

    @PostMapping("/{id}/apoios")
    @PreAuthorize("hasRole('GESTOR')")
    public ZonaRiscoDTO vincularApoio(@PathVariable UUID id, @Valid @RequestBody VincularApoioRequest req) {
        return service.vincularApoio(id, req.idPontoApoio());
    }

    @DeleteMapping("/{id}/apoios/{idPontoApoio}")
    @PreAuthorize("hasRole('GESTOR')")
    public ZonaRiscoDTO desvincularApoio(@PathVariable UUID id, @PathVariable UUID idPontoApoio) {
        return service.desvincularApoio(id, idPontoApoio);
    }
}
