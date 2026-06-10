package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.PontoApoioGeral;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.apoio.PontoApoioGeralDTO;
import br.com.iara.iara_api.dto.apoio.PontoApoioGeralRequest;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.PontoApoioGeralRepository;
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
public class PontoApoioGeralService {

    private final PontoApoioGeralRepository repository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public PontoApoioGeralDTO criar(PontoApoioGeralRequest req) {
        Usuario u = currentUser.require();
        PontoApoioGeral p = new PontoApoioGeral();
        p.setTenant(tenantScope.effectiveTenant(u));
        p.setNome(req.nome());
        p.setDescricao(req.descricao());
        p.setGeometria(GeoUtil.point(req.coordenadas()));
        p.setContato(req.contato());
        p.setResponsavel(req.responsavel());
        p.setEnderecoTxt(req.enderecoTxt());
        return PontoApoioGeralDTO.from(repository.save(p));
    }

    @Transactional(readOnly = true)
    public List<PontoApoioGeralDTO> listar(Boolean livre) {
        Usuario u = currentUser.require();
        List<UUID> tenants = tenantScope.visibleTenantIds(u);
        List<PontoApoioGeral> dados = Boolean.TRUE.equals(livre)
                ? repository.findByTenantIdInAndZonaRiscoIsNullAndIsActiveTrueOrderByNome(tenants)
                : repository.findByTenantIdInOrderByNome(tenants);
        return dados.stream().map(PontoApoioGeralDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public PontoApoioGeralDTO detalhar(UUID id) {
        return PontoApoioGeralDTO.from(buscarVisivel(id));
    }

    @Transactional
    public PontoApoioGeralDTO desativar(UUID id) {
        PontoApoioGeral p = buscarVisivel(id);
        p.setActive(false);
        p.setZonaRisco(null);
        return PontoApoioGeralDTO.from(p);
    }

    PontoApoioGeral buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        PontoApoioGeral p = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ponto de apoio não encontrado"));
        if (!tenantScope.canSee(u, p.getTenant().getId())) {
            throw new ForbiddenException("Ponto de apoio fora do seu escopo de tenant");
        }
        return p;
    }
}
