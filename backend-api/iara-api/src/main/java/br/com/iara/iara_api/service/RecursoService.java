package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.dto.recurso.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecursoService {

    private final RecursoDcRepository recursoRepository;
    private final RecursoDcEventoRepository recursoEventoRepository;
    private final RecursoTipoRepository recursoTipoRepository;
    private final EventoRepository eventoRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    // -------------------------------------------------------------- catálogo

    @Transactional
    public RecursoDTO criar(RecursoRequest req) {
        Usuario u = currentUser.require();
        RecursoTipo tipo = recursoTipoRepository.findById(req.idTipo())
                .orElseThrow(() -> new NotFoundException("Tipo de recurso não encontrado"));
        RecursoDc r = new RecursoDc();
        r.setTenant(tenantScope.effectiveTenant(u));
        r.setTipo(tipo);
        r.setIdentificacao(req.identificacao());
        r.setDescricao(req.descricao());
        if (req.localizacao() != null) {
            r.setLocalizacao(GeoUtil.point(req.localizacao()));
        }
        if (req.status() != null) {
            r.setStatus(req.status());
        }
        return RecursoDTO.from(recursoRepository.save(r));
    }

    @Transactional(readOnly = true)
    public List<RecursoDTO> listar(String status, UUID tipoId) {
        Usuario u = currentUser.require();
        return recursoRepository.filtrar(tenantScope.visibleTenantIds(u), status, tipoId)
                .stream().map(RecursoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public RecursoDTO detalhar(UUID id) {
        return RecursoDTO.from(buscarVisivel(id));
    }

    @Transactional
    public RecursoDTO atualizar(UUID id, RecursoRequest req) {
        RecursoDc r = buscarVisivel(id);
        r.setIdentificacao(req.identificacao());
        r.setDescricao(req.descricao());
        if (req.status() != null) {
            r.setStatus(req.status());
        }
        if (req.localizacao() != null) {
            r.setLocalizacao(GeoUtil.point(req.localizacao()));
        }
        return RecursoDTO.from(r);
    }

    @Transactional
    public RecursoDTO atualizarLocalizacao(UUID id, CoordenadasDTO coords) {
        RecursoDc r = buscarVisivel(id);
        r.setLocalizacao(GeoUtil.point(coords));
        return RecursoDTO.from(r);
    }

    @Transactional(readOnly = true)
    public List<RecursoDTO> disponiveis(UUID idEvento, int raio) {
        return recursoRepository.disponiveisProximos(idEvento, raio).stream().map(RecursoDTO::from).toList();
    }

    // -------------------------------------------------------------- alocação (RN15)

    @Transactional
    public RecursoEventoDTO alocar(UUID eventoId, AlocarRecursoRequest req) {
        Usuario u = currentUser.require();
        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new NotFoundException("Evento não encontrado"));
        RecursoDc recurso = recursoRepository.findById(req.idRecurso())
                .orElseThrow(() -> new NotFoundException("Recurso não encontrado"));
        // RN15: condutor obrigatório para alocação de recursos móveis
        if (req.condutorNome() == null || req.condutorNome().isBlank()
                || req.condutorContato() == null || req.condutorContato().isBlank()) {
            throw new BusinessException("RN15: condutor (nome e contato) é obrigatório na alocação");
        }
        RecursoDcEvento re = new RecursoDcEvento();
        re.setRecurso(recurso);
        re.setEvento(evento);
        re.setAlocouPor(u);
        re.setCondutorNome(req.condutorNome());
        re.setCondutorContato(req.condutorContato());
        re.setCondutorHabilitacao(req.condutorHabilitacao());
        re.setResponsavelNome(req.responsavelNome());
        re.setResponsavelContato(req.responsavelContato());
        re.setObservacao(req.observacao());
        recursoEventoRepository.save(re);
        recurso.setStatus("EM_OPERACAO");
        return RecursoEventoDTO.from(re);
    }

    @Transactional(readOnly = true)
    public List<RecursoEventoDTO> alocados(UUID eventoId) {
        return recursoEventoRepository.findByEventoId(eventoId).stream().map(RecursoEventoDTO::from).toList();
    }

    @Transactional
    public RecursoEventoDTO liberar(UUID eventoId, UUID recursoId) {
        RecursoDcEvento re = recursoEventoRepository.findByEventoIdAndRecursoId(eventoId, recursoId)
                .orElseThrow(() -> new NotFoundException("Alocação não encontrada"));
        re.setDataLiberacao(OffsetDateTime.now());
        re.getRecurso().setStatus("DISPONIVEL");
        return RecursoEventoDTO.from(re);
    }

    private RecursoDc buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        RecursoDc r = recursoRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Recurso não encontrado"));
        if (!tenantScope.canSee(u, r.getTenant().getId())) {
            throw new ForbiddenException("Recurso fora do seu escopo de tenant");
        }
        return r;
    }
}
