package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.pc.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ConflictException;
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
public class PcService {

    private final PcRepository pcRepository;
    private final PcEventoRepository pcEventoRepository;
    private final PcEstoqueRepository estoqueRepository;
    private final HelperRepository helperRepository;
    private final DemandaTipoRepository demandaTipoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final EnderecoRepository enderecoRepository;
    private final InventoryTransactionRepository inventoryRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    // Ranking de perfis (espelha SecurityConfig) — usado para promover ao mínimo COORDENADOR.
    private static int rank(String roleNome) {
        return switch (roleNome) {
            case "ADMIN" -> 5;
            case "GESTOR" -> 4;
            case "MONITOR" -> 3;
            case "COORDENADOR" -> 2;
            case "TECNICO", "DOADOR" -> 1;
            default -> 0; // USUARIO_SIMPLES
        };
    }

    // -------------------------------------------------------------- CRUD

    @Transactional
    public PcDTO criar(CreatePcRequest req) {
        Usuario actor = currentUser.require();
        boolean isGestor = "GESTOR".equals(actor.getRole().getRoleNome())
                || "ADMIN".equals(actor.getRole().getRoleNome());

        // Identifica o coordenador-alvo. Coordenador-self-create: idCoordenador omitido.
        Usuario coordenador;
        if (req.idCoordenador() != null) {
            if (!isGestor) {
                throw new ForbiddenException("Apenas gestores podem vincular outro usuário como coordenador");
            }
            coordenador = usuarioRepository.findById(req.idCoordenador())
                    .orElseThrow(() -> new NotFoundException("Usuário coordenador não encontrado"));
            if (!tenantScope.canSee(actor, coordenador.getTenant().getId())) {
                throw new ForbiddenException("Coordenador fora do seu escopo de tenant");
            }
        } else {
            coordenador = actor;
        }

        // Validação 1:1 — coordenador não pode ter outro PC ativo.
        if (pcRepository.existsByCoordenadorIdAndIsActiveTrue(coordenador.getId())) {
            throw new ConflictException("Coordenador já está vinculado a um PC ativo");
        }

        // Promove papel se gestor está promovendo (rank < COORDENADOR).
        if (req.idCoordenador() != null
                && rank(coordenador.getRole().getRoleNome()) < rank("COORDENADOR")) {
            Role papel = roleRepository.findByRoleNome("COORDENADOR")
                    .orElseThrow(() -> new NotFoundException("Perfil COORDENADOR não encontrado"));
            coordenador.setRole(papel);
            usuarioRepository.save(coordenador);
        }

        // Resolve endereço + coordenadas: endereço.coordenadas têm precedência.
        // Quando o endereço é fornecido, persiste; senão preserva o fluxo legado.
        Endereco endereco = null;
        if (req.endereco() != null) {
            if (req.endereco().coordenadas() == null) {
                throw new BusinessException("Endereço precisa ter coordenadas (lat/lng)");
            }
            endereco = enderecoFromInput(req.endereco());
        }
        var coordsSource = endereco != null
                ? req.endereco().coordenadas()
                : req.coordenadas();
        if (coordsSource == null) {
            throw new BusinessException("Coordenadas obrigatórias (no endereço ou no campo coordenadas)");
        }

        Pc pc = new Pc();
        pc.setTenant(coordenador.getTenant());
        pc.setCoordenador(coordenador);
        pc.setEndereco(endereco);
        pc.setPcNome(req.pcNome());
        if (req.pcTipo() != null) {
            pc.setPcTipo(req.pcTipo());
        }
        pc.setPcCoords(GeoUtil.point(coordsSource));
        pc.setPcDesc(req.pcDesc());
        pc.setPcContato(req.pcContato());

        // Gestor cria PC já verificado e ativo; coordenador self-create aguarda aprovação.
        if (isGestor) {
            pc.setStatusVerificacao("VERIFICADO");
            pc.setPcIsVerified(true);
            pc.setVerificador(actor);
            pc.setDataVerificacao(OffsetDateTime.now());
            pc.setActive(true);
        } else {
            pc.setStatusVerificacao("PENDENTE_VERIFICACAO_GESTOR");
            pc.setActive(false);
        }
        return PcDTO.from(pcRepository.save(pc));
    }

    /** Helper para criar Endereco a partir do input do request. Reusa GeoUtil. */
    private Endereco enderecoFromInput(br.com.iara.iara_api.dto.usuario.UpdateMeRequest.EnderecoInput in) {
        Endereco e = new Endereco();
        e.setCep(in.cep());
        e.setLogradouro(in.logradouro());
        e.setNumero(in.numero());
        e.setComplemento(in.complemento());
        e.setBairro(in.bairro());
        e.setCidade(in.cidade());
        e.setUf(in.uf());
        if (in.coordenadas() != null) {
            e.setCoordenadas(GeoUtil.point(in.coordenadas()));
        }
        return enderecoRepository.save(e);
    }

    @Transactional(readOnly = true)
    public List<PcDTO> listar(Boolean isActive, Boolean isVerified, String pcTipo,
                              String statusVerificacao) {
        Usuario u = currentUser.require();
        return pcRepository
                .filtrar(tenantScope.visibleTenantIds(u), isActive, isVerified, pcTipo, statusVerificacao)
                .stream().map(PcDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public PcDTO detalhar(UUID id) {
        return PcDTO.from(buscarVisivel(id));
    }

    /** PCs vinculados a um evento com o status informado (padrão ACEITO). */
    @Transactional(readOnly = true)
    public List<PcDTO> pontosColetaDoEvento(UUID eventoId, String status) {
        Usuario u = currentUser.require();
        String st = (status == null || status.isBlank()) ? "ACEITO" : status;
        return pcEventoRepository.findByEventoIdAndStatus(eventoId, st).stream()
                .map(PcEvento::getPc)
                .filter(pc -> tenantScope.canSee(u, pc.getTenant().getId()))
                .map(PcDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PcDTO> proximos(double lat, double lng, int raioMetros) {
        return pcRepository.proximos(lat, lng, raioMetros).stream().map(PcDTO::from).toList();
    }

    @Transactional
    public PcDTO atualizar(UUID id, UpdatePcRequest req) {
        Pc pc = buscarVisivel(id);
        if (req.pcNome() != null) {
            pc.setPcNome(req.pcNome());
        }
        if (req.pcDesc() != null) {
            pc.setPcDesc(req.pcDesc());
        }
        if (req.pcContato() != null) {
            pc.setPcContato(req.pcContato());
        }
        return PcDTO.from(pc);
    }

    @Transactional
    public PcDTO verificar(UUID id, VerificarPcRequest req) {
        Pc pc = buscarVisivel(id);
        boolean rejeitar = req != null && Boolean.TRUE.equals(req.rejeitar());
        if (rejeitar) {
            if (req.motivo() == null || req.motivo().isBlank()) {
                throw new BusinessException("Motivo obrigatório ao rejeitar PC");
            }
            pc.setStatusVerificacao("REJEITADO");
            pc.setMotivoRejeicao(req.motivo());
            pc.setActive(false);
        } else {
            // Aprovação: evita conflito 1:1 caso coord tenha outro PC já ativo.
            if (!pc.isActive()
                    && pcRepository.existsByCoordenadorIdAndIsActiveTrue(pc.getCoordenador().getId())) {
                throw new ConflictException("Coordenador já possui outro PC ativo — desativar antes");
            }
            pc.setStatusVerificacao("VERIFICADO");
            pc.setPcIsVerified(true);
            pc.setVerificador(currentUser.require());
            pc.setDataVerificacao(OffsetDateTime.now());
            pc.setActive(true);
            pc.setMotivoRejeicao(null);
        }
        return PcDTO.from(pc);
    }

    @Transactional
    public PcDTO desativar(UUID id) {
        Pc pc = buscarVisivel(id);
        pc.setActive(false);
        return PcDTO.from(pc);
    }

    @Transactional
    public PcDTO ativar(UUID id) {
        Pc pc = buscarVisivel(id);
        pc.setActive(true);
        return PcDTO.from(pc);
    }

    // -------------------------------------------------------------- vínculo evento

    @Transactional(readOnly = true)
    public List<PcEventoDTO> eventosDoPc(UUID pcId) {
        buscarVisivel(pcId);
        return pcEventoRepository.findByPcId(pcId).stream().map(PcEventoDTO::from).toList();
    }

    @Transactional
    public PcEventoDTO responderEvento(UUID pcId, UUID eventoId, boolean aceitar) {
        Pc pc = buscarVisivel(pcId);
        Usuario u = currentUser.require();
        if (!pc.getCoordenador().getId().equals(u.getId())) {
            throw new ForbiddenException("Apenas o coordenador do PC pode responder ao evento");
        }
        PcEvento pe = pcEventoRepository.findByPcIdAndEventoId(pcId, eventoId)
                .orElseThrow(() -> new NotFoundException("Vínculo PC↔evento não encontrado"));
        pe.setStatus(aceitar ? "ACEITO" : "RECUSADO");
        pe.setDataResposta(OffsetDateTime.now());
        pe.setResponsavel(u);
        return PcEventoDTO.from(pe);
    }

    // -------------------------------------------------------------- estoque

    @Transactional(readOnly = true)
    public List<EstoqueDTO> estoque(UUID pcId) {
        buscarVisivel(pcId);
        return estoqueRepository.findByPcId(pcId).stream().map(EstoqueDTO::from).toList();
    }

    @Transactional
    public EstoqueDTO atualizarEstoque(UUID pcId, UUID tipoId, int quantidade) {
        Pc pc = buscarVisivel(pcId);
        PcEstoque est = estoqueRepository.findByPcIdAndTipoId(pcId, tipoId).orElseGet(() -> {
            PcEstoque novo = new PcEstoque();
            novo.setPc(pc);
            novo.setTipo(demandaTipoRepository.findById(tipoId)
                    .orElseThrow(() -> new NotFoundException("Tipo de demanda não encontrado")));
            return novo;
        });
        est.setQuantidade(quantidade);
        est.setAlteradoPor(currentUser.require());
        return EstoqueDTO.from(estoqueRepository.save(est));
    }

    // -------------------------------------------------------------- helpers

    @Transactional
    public HelperDTO convidar(UUID pcId, UUID idUsuario) {
        Pc pc = buscarVisivel(pcId);
        Usuario tecnico = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        return HelperDTO.from(criarHelper(pc, tecnico, "COORDENADOR"));
    }

    @Transactional
    public HelperDTO solicitar(UUID pcId) {
        Pc pc = buscarVisivel(pcId);
        return HelperDTO.from(criarHelper(pc, currentUser.require(), "VOLUNTARIO"));
    }

    @Transactional(readOnly = true)
    public List<HelperDTO> listarHelpers(UUID pcId, String status) {
        buscarVisivel(pcId);
        return helperRepository.listarPorPc(pcId, status).stream().map(HelperDTO::from).toList();
    }

    @Transactional
    public HelperDTO confirmarHelper(UUID pcId, UUID helperId) {
        Helper h = buscarHelper(pcId, helperId);
        h.setStatus("CONFIRMADO");
        h.setActive(true);
        h.setDataInicio(OffsetDateTime.now());
        return HelperDTO.from(h);
    }

    @Transactional
    public HelperDTO recusarHelper(UUID pcId, UUID helperId) {
        Helper h = buscarHelper(pcId, helperId);
        h.setStatus("RECUSADO");
        return HelperDTO.from(h);
    }

    @Transactional
    public HelperDTO encerrarHelper(UUID pcId, UUID helperId) {
        Helper h = buscarHelper(pcId, helperId);
        h.setActive(false);
        h.setDataFim(OffsetDateTime.now());
        return HelperDTO.from(h);
    }

    /**
     * Define manualmente o coordenador de um PC (GESTOR/ADMIN) e promove o usuário ao
     * perfil COORDENADOR caso ele esteja abaixo desse nível. Perfis superiores são preservados.
     */
    @Transactional
    public PcDTO definirCoordenador(UUID pcId, UUID idUsuario) {
        Usuario gestor = currentUser.require();
        Pc pc = buscarVisivel(pcId);

        Usuario alvo = usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        if (!tenantScope.canSee(gestor, alvo.getTenant().getId())) {
            throw new ForbiddenException("Usuário fora do seu escopo de tenant");
        }

        pc.setCoordenador(alvo);

        if (rank(alvo.getRole().getRoleNome()) < rank("COORDENADOR")) {
            Role coordenador = roleRepository.findByRoleNome("COORDENADOR")
                    .orElseThrow(() -> new NotFoundException("Perfil COORDENADOR não encontrado"));
            alvo.setRole(coordenador);
            usuarioRepository.save(alvo);
        }

        return PcDTO.from(pcRepository.save(pc));
    }

    // -------------------------------------------------------------- helpers internos

    Pc buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        Pc pc = pcRepository.findById(id).orElseThrow(() -> new NotFoundException("Ponto de coleta não encontrado"));
        if (!tenantScope.canSee(u, pc.getTenant().getId())) {
            throw new ForbiddenException("PC fora do seu escopo de tenant");
        }
        return pc;
    }

    private Helper criarHelper(Pc pc, Usuario usuario, String iniciadoPor) {
        if (helperRepository.findByUsuarioIdAndPcId(usuario.getId(), pc.getId()).isPresent()) {
            throw new ConflictException("Vínculo de helper já existe para este usuário e PC");
        }
        Helper h = new Helper();
        h.setPc(pc);
        h.setUsuario(usuario);
        h.setIniciadoPor(iniciadoPor);
        h.setStatus("PENDENTE");
        return helperRepository.save(h);
    }

    private Helper buscarHelper(UUID pcId, UUID helperId) {
        buscarVisivel(pcId);
        Helper h = helperRepository.findById(helperId)
                .orElseThrow(() -> new NotFoundException("Helper não encontrado"));
        if (!h.getPc().getId().equals(pcId)) {
            throw new BusinessException("Helper não pertence a este PC");
        }
        return h;
    }

    // -------------------------------------------------------------- 4D: histórico inventário

    @Transactional(readOnly = true)
    public List<br.com.iara.iara_api.dto.pc.InventoryTransactionDTO> listarTransacoes(UUID pcId, UUID eventoId) {
        buscarVisivel(pcId);
        return inventoryRepository.listar(pcId, eventoId).stream()
                .map(br.com.iara.iara_api.dto.pc.InventoryTransactionDTO::from)
                .toList();
    }
}
