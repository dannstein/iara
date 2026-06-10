package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Hospital;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.hospital.HospitalDTO;
import br.com.iara.iara_api.dto.hospital.HospitalRequest;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.HospitalRepository;
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
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public HospitalDTO criar(HospitalRequest req) {
        Usuario u = currentUser.require();
        Hospital h = new Hospital();
        h.setTenant(tenantScope.effectiveTenant(u));
        aplicar(h, req);
        return HospitalDTO.from(hospitalRepository.save(h));
    }

    @Transactional(readOnly = true)
    public List<HospitalDTO> listar() {
        Usuario u = currentUser.require();
        return hospitalRepository.findByTenantIdInOrderByNome(tenantScope.visibleTenantIds(u))
                .stream().map(HospitalDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public HospitalDTO detalhar(UUID id) {
        return HospitalDTO.from(buscarVisivel(id));
    }

    @Transactional
    public HospitalDTO atualizar(UUID id, HospitalRequest req) {
        Hospital h = buscarVisivel(id);
        aplicar(h, req);
        return HospitalDTO.from(h);
    }

    @Transactional(readOnly = true)
    public List<HospitalDTO> proximos(double lat, double lng, int raio) {
        return hospitalRepository.comLeitosProximos(lat, lng, raio).stream().map(HospitalDTO::from).toList();
    }

    private void aplicar(Hospital h, HospitalRequest req) {
        h.setNome(req.nome());
        h.setCnes(req.cnes());
        h.setTipo(req.tipo());
        h.setCoordenadas(GeoUtil.point(req.coordenadas()));
        h.setContato(req.contato());
        h.setLeitosTotal(req.leitosTotal());
        h.setLeitosDisponiveis(req.leitosDisponiveis());
        h.setLeitosUti(req.leitosUti());
        h.setLeitosUtiDisp(req.leitosUtiDisp());
        if (req.aceitaCampanha() != null) {
            h.setAceitaCampanha(req.aceitaCampanha());
        }
    }

    private Hospital buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        Hospital h = hospitalRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Hospital não encontrado"));
        if (!tenantScope.canSee(u, h.getTenant().getId())) {
            throw new ForbiddenException("Hospital fora do seu escopo de tenant");
        }
        return h;
    }
}
