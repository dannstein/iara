package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.LocalAbastecimento;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.recurso.AbastecimentoDTO;
import br.com.iara.iara_api.dto.recurso.AbastecimentoRequest;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.LocalAbastecimentoRepository;
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
public class AbastecimentoService {

    private final LocalAbastecimentoRepository repository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public AbastecimentoDTO criar(AbastecimentoRequest req) {
        Usuario u = currentUser.require();
        LocalAbastecimento l = new LocalAbastecimento();
        l.setTenant(tenantScope.effectiveTenant(u));
        aplicar(l, req);
        return AbastecimentoDTO.from(repository.save(l));
    }

    @Transactional(readOnly = true)
    public List<AbastecimentoDTO> listar() {
        Usuario u = currentUser.require();
        return repository.findByTenantIdInOrderByNome(tenantScope.visibleTenantIds(u))
                .stream().map(AbastecimentoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public AbastecimentoDTO detalhar(UUID id) {
        return AbastecimentoDTO.from(buscarVisivel(id));
    }

    @Transactional
    public AbastecimentoDTO atualizar(UUID id, AbastecimentoRequest req) {
        LocalAbastecimento l = buscarVisivel(id);
        aplicar(l, req);
        return AbastecimentoDTO.from(l);
    }

    @Transactional(readOnly = true)
    public List<AbastecimentoDTO> proximos(double lat, double lng, int raio, String tipo) {
        return repository.proximos(lat, lng, raio, tipo).stream().map(AbastecimentoDTO::from).toList();
    }

    private void aplicar(LocalAbastecimento l, AbastecimentoRequest req) {
        l.setNome(req.nome());
        l.setTipo(req.tipo());
        l.setCoordenadas(GeoUtil.point(req.coordenadas()));
        l.setDescricaoItens(req.descricaoItens());
        l.setContato(req.contato());
    }

    private LocalAbastecimento buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        LocalAbastecimento l = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Local de abastecimento não encontrado"));
        if (!tenantScope.canSee(u, l.getTenant().getId())) {
            throw new ForbiddenException("Local fora do seu escopo de tenant");
        }
        return l;
    }
}
