package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Abrigo;
import br.com.iara.iara_api.domain.AbrigoOcupante;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.abrigo.AbrigoDTO;
import br.com.iara.iara_api.dto.abrigo.AbrigoRequest;
import br.com.iara.iara_api.dto.abrigo.OcupanteDTO;
import br.com.iara.iara_api.dto.abrigo.OcupanteRequest;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.AbrigoOcupanteRepository;
import br.com.iara.iara_api.repository.AbrigoRepository;
import br.com.iara.iara_api.repository.EventoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AbrigoService {

    private final AbrigoRepository abrigoRepository;
    private final AbrigoOcupanteRepository ocupanteRepository;
    private final EventoRepository eventoRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public AbrigoDTO criar(AbrigoRequest req) {
        Usuario u = currentUser.require();
        Abrigo a = new Abrigo();
        a.setTenant(u.getTenant());
        a.setNome(req.nome());
        a.setDescricao(req.descricao());
        a.setCoordenadas(GeoUtil.point(req.coordenadas()));
        a.setCapacidadeTotal(req.capacidadeTotal());
        a.setContato(req.contato());
        a.setResponsavel(u);
        if (req.idEvento() != null) {
            a.setEvento(eventoRepository.findById(req.idEvento())
                    .orElseThrow(() -> new NotFoundException("Evento não encontrado")));
        }
        return AbrigoDTO.from(abrigoRepository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AbrigoDTO> listar(Boolean isActive, UUID idEvento) {
        Usuario u = currentUser.require();
        return abrigoRepository.filtrar(tenantScope.visibleTenantIds(u), isActive, idEvento)
                .stream().map(AbrigoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public AbrigoDTO detalhar(UUID id) {
        return AbrigoDTO.from(buscarVisivel(id));
    }

    @Transactional
    public AbrigoDTO atualizar(UUID id, AbrigoRequest req) {
        Abrigo a = buscarVisivel(id);
        a.setNome(req.nome());
        a.setDescricao(req.descricao());
        a.setCapacidadeTotal(req.capacidadeTotal());
        a.setContato(req.contato());
        return AbrigoDTO.from(a);
    }

    @Transactional(readOnly = true)
    public List<AbrigoDTO> proximos(UUID idEvento, int raio) {
        return abrigoRepository.comVagasProximosAoEvento(idEvento, raio).stream().map(AbrigoDTO::from).toList();
    }

    // -------------------------------------------------------------- ocupantes

    @Transactional
    public OcupanteDTO registrarOcupante(UUID abrigoId, OcupanteRequest req) {
        Abrigo a = buscarVisivel(abrigoId);
        boolean prioridade = req.idoso() || req.crianca() || req.pcd() || req.gestante();
        if (a.getOcupacaoAtual() >= a.getCapacidadeTotal()) {
            if (prioridade) {
                throw new ConflictException("Abrigo lotado — vaga prioritária bloqueada (RN12)",
                        Map.of("priority_blocked", true));
            }
            throw new ConflictException("Abrigo lotado");
        }
        AbrigoOcupante o = new AbrigoOcupante();
        o.setAbrigo(a);
        o.setNome(req.nome());
        o.setDocumento(req.documento());
        o.setIdade(req.idade());
        o.setIdoso(req.idoso());
        o.setCrianca(req.crianca());
        o.setPcd(req.pcd());
        o.setGestante(req.gestante());
        o.setNecessidadeEspecialTipo(req.necessidadeEspecialTipo());
        o.setCadastradoPor(currentUser.require());
        ocupanteRepository.save(o);
        a.setOcupacaoAtual(a.getOcupacaoAtual() + 1);
        return OcupanteDTO.from(o);
    }

    @Transactional(readOnly = true)
    public List<OcupanteDTO> listarOcupantes(UUID abrigoId, Boolean isPrioridade) {
        buscarVisivel(abrigoId);
        return ocupanteRepository.listar(abrigoId, isPrioridade).stream().map(OcupanteDTO::from).toList();
    }

    @Transactional
    public OcupanteDTO atualizarOcupante(UUID abrigoId, UUID ocupanteId, OcupanteRequest req) {
        buscarVisivel(abrigoId);
        AbrigoOcupante o = buscarOcupante(abrigoId, ocupanteId);
        if (req.documento() != null) {
            o.setDocumento(req.documento());
        }
        if (req.idade() != null) {
            o.setIdade(req.idade());
        }
        if (req.necessidadeEspecialTipo() != null) {
            o.setNecessidadeEspecialTipo(req.necessidadeEspecialTipo());
        }
        return OcupanteDTO.from(o);
    }

    @Transactional
    public OcupanteDTO registrarSaida(UUID abrigoId, UUID ocupanteId) {
        Abrigo a = buscarVisivel(abrigoId);
        AbrigoOcupante o = buscarOcupante(abrigoId, ocupanteId);
        if (o.getDataSaida() == null) {
            o.setDataSaida(OffsetDateTime.now());
            a.setOcupacaoAtual(Math.max(0, a.getOcupacaoAtual() - 1));
        }
        return OcupanteDTO.from(o);
    }

    // -------------------------------------------------------------- helpers

    private Abrigo buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        Abrigo a = abrigoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Abrigo não encontrado"));
        if (!tenantScope.canSee(u, a.getTenant().getId())) {
            throw new ForbiddenException("Abrigo fora do seu escopo de tenant");
        }
        return a;
    }

    private AbrigoOcupante buscarOcupante(UUID abrigoId, UUID ocupanteId) {
        AbrigoOcupante o = ocupanteRepository.findById(ocupanteId)
                .orElseThrow(() -> new NotFoundException("Ocupante não encontrado"));
        if (!o.getAbrigo().getId().equals(abrigoId)) {
            throw new NotFoundException("Ocupante não pertence a este abrigo");
        }
        return o;
    }
}
