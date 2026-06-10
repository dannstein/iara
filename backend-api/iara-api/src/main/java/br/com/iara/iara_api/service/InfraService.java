package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.InfraMunicipal;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.infra.InfraDTO;
import br.com.iara.iara_api.dto.infra.InfraRequest;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.InfraMunicipalRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InfraService {

    private final InfraMunicipalRepository infraRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public InfraDTO criar(InfraRequest req) {
        Usuario u = currentUser.require();
        InfraMunicipal i = new InfraMunicipal();
        i.setTenant(tenantScope.effectiveTenant(u));
        aplicar(i, req);
        return InfraDTO.from(infraRepository.save(i));
    }

    @Transactional(readOnly = true)
    public List<InfraDTO> listar(String tipo) {
        Usuario u = currentUser.require();
        return infraRepository.filtrar(tenantScope.visibleTenantIds(u), tipo)
                .stream().map(InfraDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public InfraDTO detalhar(UUID id) {
        return InfraDTO.from(buscarVisivel(id));
    }

    @Transactional
    public InfraDTO atualizar(UUID id, InfraRequest req) {
        InfraMunicipal i = buscarVisivel(id);
        aplicar(i, req);
        return InfraDTO.from(i);
    }

    @Transactional(readOnly = true)
    public List<InfraDTO> proximos(UUID idEvento, int raio) {
        return infraRepository.proximosAoEvento(idEvento, raio).stream().map(InfraDTO::from).toList();
    }

    private void aplicar(InfraMunicipal i, InfraRequest req) {
        i.setNome(req.nome());
        i.setTipo(req.tipo());
        i.setCoordenadas(GeoUtil.point(req.coordenadas()));
        i.setContato24h(req.contato24h());
        i.setCapacidadeAtendimento(req.capacidadeAtendimento());
        i.setResponsavelNome(req.responsavelNome());
        i.setResponsavelContato(req.responsavelContato());
        i.setDescricao(req.descricao());
    }

    private InfraMunicipal buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        InfraMunicipal i = infraRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Infraestrutura não encontrada"));
        if (!tenantScope.canSee(u, i.getTenant().getId())) {
            throw new ForbiddenException("Infraestrutura fora do seu escopo de tenant");
        }
        return i;
    }
}
