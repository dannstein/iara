package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.CheckinDTO;
import br.com.iara.iara_api.dto.evento.CheckinRequest;
import br.com.iara.iara_api.service.CheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/eventos/{eventoId}")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService service;

    @PostMapping("/checkin")
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<CheckinDTO> checkin(@PathVariable UUID eventoId,
                                              @Valid @RequestBody CheckinRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.checkin(eventoId, req));
    }

    @PatchMapping("/checkout")
    @PreAuthorize("hasRole('TECNICO')")
    public CheckinDTO checkout(@PathVariable UUID eventoId) {
        return service.checkout(eventoId);
    }

    @GetMapping("/checkins")
    @PreAuthorize("hasRole('MONITOR')")
    public List<CheckinDTO> listar(@PathVariable UUID eventoId) {
        return service.listarAtivos(eventoId);
    }
}
