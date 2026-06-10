package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.atencao.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.integration.GeocodingService;
import br.com.iara.iara_api.messaging.NotificationPublisher;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PontoAtencaoService {

    private final PontoAtencaoRepository pontoRepository;
    private final PontoApoioRepository pontoApoioRepository;
    private final AtencaoApoioRepository apoioRepository;
    private final AtencaoDesastreRepository desastreRepository;
    private final PcRepository pcRepository;
    private final AbrigoRepository abrigoRepository;
    private final DesastreTipoRepository desastreTipoRepository;
    private final GeocodingService geocodingService;
    private final NotificationPublisher notificationPublisher;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    // -------------------------------------------------------------- CRUD

    @Transactional
    public PontoAtencaoDTO criar(PontoAtencaoRequest req) {
        Usuario u = currentUser.require();
        if (req.isIndustrial()
                && (req.substanciaPerigosaTxt() == null || req.classeRiscoIndustrial() == null)) {
            throw new BusinessException(
                    "RN23: ponto industrial exige substância perigosa e classe de risco");
        }
        PontoAtencao p = new PontoAtencao();
        p.setTenant(tenantScope.effectiveTenant(u));
        p.setCadastradoPor(u);
        p.setNome(req.nome());
        p.setDescricao(req.descricao());
        p.setEnderecoTxt(req.enderecoTxt());
        p.setGeometria(geocodingService.geocode(req.enderecoTxt())); // RN20
        p.setIndustrial(req.isIndustrial());
        p.setSubstanciaPerigosaTxt(req.substanciaPerigosaTxt());
        p.setClasseRiscoIndustrial(req.classeRiscoIndustrial());
        if (req.nivelRisco() != null) {
            p.setNivelRisco(req.nivelRisco());
        }
        p.setPopulacaoEstimada(req.populacaoEstimada());
        p.setSituacaoApoio("SEM_APOIO");
        pontoRepository.save(p);
        alertarSemApoio(p);
        return PontoAtencaoDTO.from(p);
    }

    @Transactional(readOnly = true)
    public List<PontoAtencaoDTO> listar(Boolean isActive, Boolean isIndustrial, String situacaoApoio) {
        Usuario u = currentUser.require();
        return pontoRepository.filtrar(tenantScope.visibleTenantIds(u), isActive, isIndustrial, situacaoApoio)
                .stream().map(PontoAtencaoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public PontoAtencaoDTO detalhar(UUID id) {
        return PontoAtencaoDTO.from(buscarVisivel(id));
    }

    @Transactional
    public PontoAtencaoDTO atualizar(UUID id, PontoAtencaoRequest req) {
        PontoAtencao p = buscarVisivel(id);
        p.setNome(req.nome());
        p.setDescricao(req.descricao());
        if (!req.enderecoTxt().equals(p.getEnderecoTxt())) {
            p.setEnderecoTxt(req.enderecoTxt());
            p.setGeometria(geocodingService.geocode(req.enderecoTxt()));
        }
        p.setIndustrial(req.isIndustrial());
        p.setSubstanciaPerigosaTxt(req.substanciaPerigosaTxt());
        p.setClasseRiscoIndustrial(req.classeRiscoIndustrial());
        if (req.nivelRisco() != null) {
            p.setNivelRisco(req.nivelRisco());
        }
        p.setPopulacaoEstimada(req.populacaoEstimada());
        return PontoAtencaoDTO.from(p);
    }

    @Transactional
    public PontoAtencaoDTO desativar(UUID id) {
        PontoAtencao p = buscarVisivel(id);
        p.setActive(false);
        return PontoAtencaoDTO.from(p);
    }

    @Transactional(readOnly = true)
    public List<PontoAtencaoDTO> proximos(double lat, double lng, int raio) {
        return pontoRepository.proximos(lat, lng, raio).stream().map(PontoAtencaoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PontoAtencaoDTO> semApoio() {
        Usuario u = currentUser.require();
        return pontoRepository.semApoio(tenantScope.visibleTenantIds(u)).stream()
                .map(PontoAtencaoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PontoAtencaoDTO> industriais() {
        Usuario u = currentUser.require();
        return pontoRepository.industriais(tenantScope.visibleTenantIds(u)).stream()
                .map(PontoAtencaoDTO::from).toList();
    }

    // -------------------------------------------------------------- apoios (RN21)

    @Transactional
    public ApoioVinculoDTO vincularApoio(UUID pontoId, ApoioVinculoRequest req) {
        PontoAtencao p = buscarVisivel(pontoId);
        int n = (req.idPc() != null ? 1 : 0) + (req.idAbrigo() != null ? 1 : 0)
                + (req.idPontoApoio() != null ? 1 : 0);
        if (n != 1) {
            throw new BusinessException("RN21: envie exatamente um de idPc, idAbrigo ou idPontoApoio");
        }
        AtencaoApoio a = new AtencaoApoio();
        a.setPontoAtencao(p);
        a.setObservacao(req.observacao());
        if (req.idPc() != null) {
            a.setPc(pcRepository.findById(req.idPc())
                    .orElseThrow(() -> new NotFoundException("PC não encontrado")));
        } else if (req.idAbrigo() != null) {
            a.setAbrigo(abrigoRepository.findById(req.idAbrigo())
                    .orElseThrow(() -> new NotFoundException("Abrigo não encontrado")));
        } else {
            a.setPontoApoio(pontoApoioRepository.findById(req.idPontoApoio())
                    .orElseThrow(() -> new NotFoundException("Ponto de apoio não encontrado")));
        }
        apoioRepository.save(a);
        if ("SEM_APOIO".equals(p.getSituacaoApoio())) {
            p.setSituacaoApoio("COM_APOIO");
        }
        return ApoioVinculoDTO.from(a);
    }

    @Transactional(readOnly = true)
    public List<ApoioVinculoDTO> listarApoios(UUID pontoId) {
        buscarVisivel(pontoId);
        return apoioRepository.findByPontoAtencaoId(pontoId).stream().map(ApoioVinculoDTO::from).toList();
    }

    @Transactional
    public void removerApoio(UUID pontoId, UUID apoioId) {
        PontoAtencao p = buscarVisivel(pontoId);
        AtencaoApoio a = apoioRepository.findById(apoioId)
                .orElseThrow(() -> new NotFoundException("Vínculo de apoio não encontrado"));
        if (!a.getPontoAtencao().getId().equals(pontoId)) {
            throw new NotFoundException("Vínculo não pertence a este ponto");
        }
        apoioRepository.delete(a);
        if (apoioRepository.countByPontoAtencaoId(pontoId) == 0) {
            p.setSituacaoApoio("SEM_APOIO");
            alertarSemApoio(p);
        }
    }

    @Transactional
    public ApoioVinculoDTO criarApoioEspecifico(UUID pontoId, PontoApoioRequest req) {
        PontoAtencao p = buscarVisivel(pontoId);
        PontoApoio pa = new PontoApoio();
        pa.setPontoAtencao(p);
        pa.setNome(req.nome());
        pa.setDescricao(req.descricao());
        pa.setEnderecoTxt(req.enderecoTxt());
        if (req.enderecoTxt() != null && !req.enderecoTxt().isBlank()) {
            pa.setGeometria(geocodingService.geocode(req.enderecoTxt()));
        }
        pa.setContato(req.contato());
        pa.setResponsavel(req.responsavel());
        pontoApoioRepository.save(pa);

        AtencaoApoio a = new AtencaoApoio();
        a.setPontoAtencao(p);
        a.setPontoApoio(pa);
        apoioRepository.save(a);
        if ("SEM_APOIO".equals(p.getSituacaoApoio())) {
            p.setSituacaoApoio("COM_APOIO");
        }
        return ApoioVinculoDTO.from(a);
    }

    // -------------------------------------------------------------- desastres (RN22)

    @Transactional
    public DesastreVinculoDTO vincularDesastre(UUID pontoId, UUID desastreTipoId, String observacao) {
        PontoAtencao p = buscarVisivel(pontoId);
        if (desastreRepository.existsByPontoAtencaoIdAndDesastreTipoId(pontoId, desastreTipoId)) {
            throw new BusinessException("Tipo de desastre já vinculado a este ponto");
        }
        DesastreTipo tipo = desastreTipoRepository.findById(desastreTipoId)
                .orElseThrow(() -> new NotFoundException("Tipo de desastre não encontrado"));
        AtencaoDesastre d = new AtencaoDesastre();
        d.setPontoAtencao(p);
        d.setDesastreTipo(tipo);
        d.setObservacao(observacao);
        return DesastreVinculoDTO.from(desastreRepository.save(d));
    }

    @Transactional(readOnly = true)
    public List<DesastreVinculoDTO> listarDesastres(UUID pontoId) {
        buscarVisivel(pontoId);
        return desastreRepository.findByPontoAtencaoId(pontoId).stream().map(DesastreVinculoDTO::from).toList();
    }

    @Transactional
    public void removerDesastre(UUID pontoId, UUID desastreVinculoId) {
        buscarVisivel(pontoId);
        AtencaoDesastre d = desastreRepository.findById(desastreVinculoId)
                .orElseThrow(() -> new NotFoundException("Vínculo de desastre não encontrado"));
        if (!d.getPontoAtencao().getId().equals(pontoId)) {
            throw new NotFoundException("Vínculo não pertence a este ponto");
        }
        desastreRepository.delete(d);
    }

    // -------------------------------------------------------------- helpers

    private PontoAtencao buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        PontoAtencao p = pontoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ponto de atenção não encontrado"));
        if (!tenantScope.canSee(u, p.getTenant().getId())) {
            throw new ForbiddenException("Ponto fora do seu escopo de tenant");
        }
        return p;
    }

    private void alertarSemApoio(PontoAtencao p) {
        if (p.getCadastradoPor() != null) {
            notificationPublisher.notify(p.getCadastradoPor().getId(),
                    "Ponto de atenção sem apoio: " + p.getNome(),
                    "Área crítica cadastrada sem ponto de apoio vinculado — requer ação (RN21).",
                    "SISTEMA", p.getId());
        }
    }
}
