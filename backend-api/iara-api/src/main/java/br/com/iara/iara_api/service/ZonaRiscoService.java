package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.PontoApoioGeral;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.domain.ZonaRisco;
import br.com.iara.iara_api.dto.zona.ZonaRiscoDTO;
import br.com.iara.iara_api.dto.zona.ZonaRiscoRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.PontoApoioGeralRepository;
import br.com.iara.iara_api.repository.ZonaRiscoRepository;
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
public class ZonaRiscoService {

    /** Raio padrão (m) usado na checagem de proximidade quando a zona não define raio. */
    private static final int RAIO_PADRAO = 5000;

    private final ZonaRiscoRepository repository;
    private final PontoApoioGeralRepository apoioRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public ZonaRiscoDTO criar(ZonaRiscoRequest req) {
        Usuario u = currentUser.require();
        ZonaRisco z = new ZonaRisco();
        z.setTenant(u.getTenant());
        z.setCadastradoPor(u);
        aplicar(z, req);
        repository.save(z);

        if (req.idsPontoApoio() != null) {
            for (UUID idApoio : req.idsPontoApoio()) {
                vincular(z, idApoio);
            }
        }
        return ZonaRiscoDTO.from(z);
    }

    @Transactional(readOnly = true)
    public List<ZonaRiscoDTO> listar() {
        Usuario u = currentUser.require();
        return repository.findByTenantIdInAndIsActiveTrueOrderByNivelRiscoDesc(tenantScope.visibleTenantIds(u))
                .stream().map(ZonaRiscoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public ZonaRiscoDTO detalhar(UUID id) {
        return ZonaRiscoDTO.from(buscarVisivel(id));
    }

    @Transactional
    public ZonaRiscoDTO atualizar(UUID id, ZonaRiscoRequest req) {
        ZonaRisco z = buscarVisivel(id);
        aplicar(z, req);
        return ZonaRiscoDTO.from(z);
    }

    @Transactional
    public ZonaRiscoDTO desativar(UUID id) {
        ZonaRisco z = buscarVisivel(id);
        z.setActive(false);
        // Libera os pontos de apoio para que possam ser realocados a outra zona próxima.
        apoioRepository.findByZonaRiscoIdAndIsActiveTrue(z.getId())
                .forEach(a -> a.setZonaRisco(null));
        z.getApoios().clear();
        return ZonaRiscoDTO.from(z);
    }

    @Transactional
    public ZonaRiscoDTO vincularApoio(UUID zonaId, UUID idApoio) {
        ZonaRisco z = buscarVisivel(zonaId);
        vincular(z, idApoio);
        return ZonaRiscoDTO.from(z);
    }

    @Transactional
    public ZonaRiscoDTO desvincularApoio(UUID zonaId, UUID idApoio) {
        ZonaRisco z = buscarVisivel(zonaId);
        PontoApoioGeral apoio = apoioRepository.findById(idApoio)
                .orElseThrow(() -> new NotFoundException("Ponto de apoio não encontrado"));
        if (apoio.getZonaRisco() == null || !apoio.getZonaRisco().getId().equals(z.getId())) {
            throw new BusinessException("Este ponto de apoio não está vinculado a esta zona");
        }
        apoio.setZonaRisco(null);
        z.getApoios().removeIf(a -> a.getId().equals(idApoio));
        return ZonaRiscoDTO.from(z);
    }

    @Transactional(readOnly = true)
    public List<ZonaRiscoDTO> geofencing(double lat, double lng) {
        return repository.geofencing(lat, lng).stream().map(ZonaRiscoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<ZonaRiscoDTO> proximas(double lat, double lng, int raio) {
        return repository.proximas(lat, lng, raio).stream().map(ZonaRiscoDTO::from).toList();
    }

    // ---------------------------------------------------------------- helpers

    private void vincular(ZonaRisco z, UUID idApoio) {
        Usuario u = currentUser.require();
        PontoApoioGeral apoio = apoioRepository.findById(idApoio)
                .orElseThrow(() -> new NotFoundException("Ponto de apoio não encontrado: " + idApoio));
        if (!tenantScope.canSee(u, apoio.getTenant().getId())) {
            throw new ForbiddenException("Ponto de apoio fora do seu escopo de tenant");
        }
        if (!apoio.isActive()) {
            throw new BusinessException("Ponto de apoio inativo");
        }
        if (apoio.getZonaRisco() != null && apoio.getZonaRisco().isActive()
                && !apoio.getZonaRisco().getId().equals(z.getId())) {
            throw new ConflictException("Ponto de apoio já atende outra zona de risco ativa");
        }
        int raio = z.getRaioMetros() != null ? z.getRaioMetros() : RAIO_PADRAO;
        Double dist = apoioRepository.distanciaMetros(z.getId(), apoio.getId());
        if (dist == null || dist > raio) {
            throw new BusinessException(
                    "Ponto de apoio fora do alcance da zona (distância "
                            + (dist == null ? "?" : Math.round(dist)) + "m > raio " + raio + "m)");
        }
        apoio.setZonaRisco(z);
        // Mantém os dois lados sincronizados para o DTO refletir o vínculo imediatamente.
        if (z.getApoios().stream().noneMatch(a -> a.getId().equals(apoio.getId()))) {
            z.getApoios().add(apoio);
        }
    }

    private void aplicar(ZonaRisco z, ZonaRiscoRequest req) {
        z.setNome(req.nome());
        z.setDescricao(req.descricao());
        z.setTipo(req.tipo());
        if (req.coordenadas() != null) {
            z.setGeometria(GeoUtil.point(req.coordenadas()));
        } else if (req.geometria() != null) {
            z.setGeometria(GeoUtil.fromGeoJson(req.geometria()));
        } else {
            throw new BusinessException("Informe coordenadas (ponto+raio) ou geometria");
        }
        z.setRaioMetros(req.raioMetros());
        z.setNivelRisco(req.nivelRisco());
        z.setFonte(req.fonte());
        z.setDataMapeamento(req.dataMapeamento());
    }

    private ZonaRisco buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        ZonaRisco z = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Zona de risco não encontrada"));
        if (!tenantScope.canSee(u, z.getTenant().getId())) {
            throw new ForbiddenException("Zona fora do seu escopo de tenant");
        }
        return z;
    }
}
