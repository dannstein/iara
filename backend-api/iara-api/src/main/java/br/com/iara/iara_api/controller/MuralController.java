package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.DemandaDTO;
import br.com.iara.iara_api.service.DemandaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MuralController {

    private final DemandaService service;

    /** Mural de necessidades do evento (RF09). */
    @GetMapping("/eventos/{eventoId}/mural")
    public List<DemandaDTO> mural(@PathVariable UUID eventoId) {
        return service.mural(eventoId);
    }
}
