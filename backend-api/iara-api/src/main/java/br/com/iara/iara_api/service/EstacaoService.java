package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.EstacaoMonitoramento;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.meteorologia.EstacaoDTO;
import br.com.iara.iara_api.dto.meteorologia.EstacaoRequest;
import br.com.iara.iara_api.dto.meteorologia.MedicaoDTO;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.EstacaoMonitoramentoRepository;
import br.com.iara.iara_api.repository.MedicaoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EstacaoService {

    private final EstacaoMonitoramentoRepository estacaoRepository;
    private final MedicaoRepository medicaoRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public EstacaoDTO criar(EstacaoRequest req) {
        Usuario u = currentUser.require();
        EstacaoMonitoramento e = new EstacaoMonitoramento();
        e.setTenant(tenantScope.effectiveTenant(u));
        e.setNome(req.nome());
        e.setFonte(req.fonte());
        e.setCodigoExterno(req.codigoExterno());
        e.setCoordenadas(GeoUtil.point(req.coordenadas()));
        e.setTipo(req.tipo());
        return EstacaoDTO.from(estacaoRepository.save(e));
    }

    @Transactional(readOnly = true)
    public List<EstacaoDTO> listar() {
        Usuario u = currentUser.require();
        return estacaoRepository.findByTenantIdInOrderByNome(tenantScope.visibleTenantIds(u))
                .stream().map(EstacaoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public EstacaoDTO detalhar(UUID id) {
        return EstacaoDTO.from(buscarVisivel(id));
    }

    @Transactional(readOnly = true)
    public List<MedicaoDTO> medicoes(UUID estacaoId, int page, int size) {
        buscarVisivel(estacaoId);
        return medicaoRepository.findByEstacaoIdOrderByDataMedicaoDesc(estacaoId, PageRequest.of(page, size))
                .map(MedicaoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public MedicaoDTO ultimaMedicao(UUID estacaoId) {
        buscarVisivel(estacaoId);
        return medicaoRepository.findFirstByEstacaoIdOrderByDataMedicaoDesc(estacaoId)
                .map(MedicaoDTO::from)
                .orElseThrow(() -> new NotFoundException("Nenhuma medição para a estação"));
    }

    private EstacaoMonitoramento buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        EstacaoMonitoramento e = estacaoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Estação não encontrada"));
        if (!tenantScope.canSee(u, e.getTenant().getId())) {
            throw new ForbiddenException("Estação fora do seu escopo de tenant");
        }
        return e;
    }
}
