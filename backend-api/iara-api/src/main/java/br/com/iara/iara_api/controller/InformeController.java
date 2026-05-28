package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.InformeDTO;
import br.com.iara.iara_api.service.InformeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/eventos/{eventoId}/informes")
@RequiredArgsConstructor
public class InformeController {

    private final InformeService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<InformeDTO> criar(
            @PathVariable UUID eventoId,
            @RequestParam String descricao,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) String canalEnvio,
            @RequestParam(required = false) MultipartFile anexo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            OffsetDateTime dataSincronizacao) {
        InformeDTO dto = service.criar(eventoId, descricao, lat, lng, canalEnvio, anexo, dataSincronizacao);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping
    @PreAuthorize("hasRole('MONITOR')")
    public List<InformeDTO> listar(@PathVariable UUID eventoId,
                                   @RequestParam(name = "canal_envio", required = false) String canal) {
        return service.listar(eventoId, canal);
    }

    @GetMapping("/{informeId}")
    @PreAuthorize("hasRole('MONITOR')")
    public InformeDTO detalhar(@PathVariable UUID eventoId, @PathVariable UUID informeId) {
        return service.detalhar(eventoId, informeId);
    }
}
