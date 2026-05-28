package br.com.iara.iara_api.service;

import br.com.iara.iara_api.dto.lookup.DesastreTipoDTO;
import br.com.iara.iara_api.dto.lookup.LookupItemDTO;
import br.com.iara.iara_api.dto.lookup.RoleDTO;
import br.com.iara.iara_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LookupService {

    private final DesastreTipoRepository desastreTipoRepository;
    private final DemandaTipoRepository demandaTipoRepository;
    private final RecursoTipoRepository recursoTipoRepository;
    private final AlertaTipoRepository alertaTipoRepository;
    private final RoleRepository roleRepository;

    @Cacheable(value = "lookups", key = "'desastre-tipos'")
    public List<DesastreTipoDTO> desastreTipos() {
        return desastreTipoRepository.findAll().stream()
                .map(d -> new DesastreTipoDTO(d.getId(), d.getCobradeCod(), d.getDesastreNome(), d.getDesastreDesc()))
                .toList();
    }

    @Cacheable(value = "lookups", key = "'demanda-tipos'")
    public List<LookupItemDTO> demandaTipos() {
        return demandaTipoRepository.findAll().stream()
                .map(d -> new LookupItemDTO(d.getId(), d.getDNome(), d.getDDesc()))
                .toList();
    }

    @Cacheable(value = "lookups", key = "'recurso-tipos'")
    public List<LookupItemDTO> recursoTipos() {
        return recursoTipoRepository.findAll().stream()
                .map(r -> new LookupItemDTO(r.getId(), r.getTipoNome(), r.getTipoDesc()))
                .toList();
    }

    @Cacheable(value = "lookups", key = "'alerta-tipos'")
    public List<LookupItemDTO> alertaTipos() {
        return alertaTipoRepository.findAll().stream()
                .map(a -> new LookupItemDTO(a.getId(), a.getTipoNome(), a.getTipoDesc()))
                .toList();
    }

    @Cacheable(value = "lookups", key = "'roles'")
    public List<RoleDTO> roles() {
        return roleRepository.findAll().stream()
                .map(r -> new RoleDTO(r.getId(), r.getRoleNome(), r.getRoleDesc(), r.getNivelMin()))
                .toList();
    }
}
