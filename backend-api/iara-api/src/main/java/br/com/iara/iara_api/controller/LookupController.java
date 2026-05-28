package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.lookup.DesastreTipoDTO;
import br.com.iara.iara_api.dto.lookup.LookupItemDTO;
import br.com.iara.iara_api.dto.lookup.RoleDTO;
import br.com.iara.iara_api.service.LookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/lookup")
@RequiredArgsConstructor
public class LookupController {

    private final LookupService lookupService;

    @GetMapping("/desastre-tipos")
    public List<DesastreTipoDTO> desastreTipos() {
        return lookupService.desastreTipos();
    }

    @GetMapping("/demanda-tipos")
    public List<LookupItemDTO> demandaTipos() {
        return lookupService.demandaTipos();
    }

    @GetMapping("/recurso-tipos")
    @PreAuthorize("hasAnyRole('GESTOR','ADMIN')")
    public List<LookupItemDTO> recursoTipos() {
        return lookupService.recursoTipos();
    }

    @GetMapping("/alerta-tipos")
    @PreAuthorize("hasAnyRole('GESTOR','ADMIN')")
    public List<LookupItemDTO> alertaTipos() {
        return lookupService.alertaTipos();
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RoleDTO> roles() {
        return lookupService.roles();
    }
}
