package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.alerta.AlertaAutomaticoDTO;
import br.com.iara.iara_api.dto.alerta.AlertaAutomaticoLogDTO;
import br.com.iara.iara_api.service.automatico.AlertaAutomaticoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alertas/automaticos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('GESTOR')")
public class AlertaAutomaticoController {

    private final AlertaAutomaticoService service;

    @GetMapping
    public List<AlertaAutomaticoDTO> listar() {
        return service.listar();
    }

    @PatchMapping("/{ruleId}/ativar")
    public AlertaAutomaticoDTO ativar(@PathVariable String ruleId,
                                       @RequestBody(required = false) Map<String, Object> config) {
        return service.ativar(ruleId, config);
    }

    @PatchMapping("/{ruleId}/desativar")
    public AlertaAutomaticoDTO desativar(@PathVariable String ruleId) {
        return service.desativar(ruleId);
    }

    @PutMapping("/{ruleId}/config")
    public AlertaAutomaticoDTO atualizarConfig(@PathVariable String ruleId,
                                                @RequestBody Map<String, Object> config) {
        return service.atualizarConfig(ruleId, config);
    }

    @GetMapping("/log")
    public Page<AlertaAutomaticoLogDTO> log(@RequestParam(required = false) String ruleId,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "50") int size) {
        return service.log(ruleId, page, size);
    }
}
