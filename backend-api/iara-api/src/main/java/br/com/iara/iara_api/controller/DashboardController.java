package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MONITOR')")
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/eventos")
    public Map<String, Object> eventos(@RequestParam(name = "is_simulado", defaultValue = "false") boolean sim) {
        return service.eventos(sim);
    }

    @GetMapping("/incidentes")
    public Map<String, Object> incidentes(@RequestParam(name = "is_simulado", defaultValue = "false") boolean sim) {
        return service.incidentes(sim);
    }

    @GetMapping("/doacoes")
    @PreAuthorize("hasRole('GESTOR')")
    public Map<String, Object> doacoes() {
        return service.doacoes();
    }

    @GetMapping("/tecnicos")
    @PreAuthorize("hasRole('GESTOR')")
    public Map<String, Object> tecnicos() {
        return service.tecnicos();
    }

    @GetMapping("/abrigos")
    public Map<String, Object> abrigos() {
        return service.abrigos();
    }

    @GetMapping("/pcs")
    public Map<String, Object> pcs() {
        return service.pcs();
    }

    @GetMapping("/pontos-atencao")
    @PreAuthorize("hasRole('GESTOR')")
    public Map<String, Object> pontosAtencao() {
        return service.pontosAtencao();
    }

    @GetMapping("/zonas-risco")
    public Map<String, Object> zonasRisco() {
        return service.zonasRisco();
    }
}
