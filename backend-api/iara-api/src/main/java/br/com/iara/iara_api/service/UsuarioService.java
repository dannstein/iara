package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.*;
import br.com.iara.iara_api.dto.auth.TokenResponse;
import br.com.iara.iara_api.dto.usuario.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.integration.FileStorageService;
import br.com.iara.iara_api.messaging.NotificationPublisher;
import br.com.iara.iara_api.dto.usuario.EventoComUsuariosDTO;
import br.com.iara.iara_api.dto.usuario.UsuarioLocalizacaoDTO;
import br.com.iara.iara_api.dto.usuario.UsuariosEmRiscoDTO;
import br.com.iara.iara_api.dto.usuario.ZonaComUsuariosDTO;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RoleRepository roleRepository;
    private final TenantRepository tenantRepository;
    private final EspecRepository especRepository;
    private final EnderecoRepository enderecoRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final FileStorageService fileStorageService;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;
    private final NotificationPublisher notificationPublisher;
    private final CheckinRepository checkinRepository;
    private final VitimaTriagemRepository triagemRepository;
    private final ZonaRiscoRepository zonaRiscoRepository;
    private final EventoRepository eventoRepository;

    // ---------------------------------------------------------------- cadastro

    @Transactional
    public TokenResponse cadastrarDoador(CadastroPublicoRequest req) {
        return cadastrarAprovado(req, "DOADOR");
    }

    @Transactional
    public TokenResponse cadastrarSimples(CadastroPublicoRequest req) {
        return cadastrarAprovado(req, "USUARIO_SIMPLES");
    }

    @Transactional
    public TokenResponse cadastrarCoordenador(CadastroPublicoRequest req) {
        // O ponto de coleta vinculado é criado no módulo de PC (Fase 3).
        return cadastrarAprovado(req, "COORDENADOR");
    }

    private TokenResponse cadastrarAprovado(CadastroPublicoRequest req, String roleNome) {
        validarUnico(req.email(), req.documento());
        Tenant tenant = tenantRepository.findById(req.tenantId())
                .orElseThrow(() -> new NotFoundException("Tenant não encontrado"));
        Role role = roleRepository.findByRoleNome(roleNome)
                .orElseThrow(() -> new NotFoundException("Perfil não encontrado: " + roleNome));

        Usuario u = new Usuario();
        u.setNome(req.nome());
        u.setEmail(req.email());
        u.setTelefone(req.telefone());
        u.setDocumento(req.documento());
        u.setSenhaHash(passwordEncoder.encode(req.senha()));
        u.setTenant(tenant);
        u.setRole(role);
        u.setCadastroSts("APROVADO");
        u.setDataAprovacaoCadastro(OffsetDateTime.now());
        usuarioRepository.save(u);

        return refreshTokenService.issueTokenPair(u);
    }

    @Transactional
    public UsuarioDTO cadastrarTecnico(String nome, String email, String telefone, String documento,
                                       String senha, UUID tenantId, UUID idEspec,
                                       String docComprovacaoNumero, MultipartFile comprovante) {
        // RN24: especialidade + comprovação (número e arquivo) são obrigatórias
        // TODO: reativar "|| comprovante == null || comprovante.isEmpty()" quando o storage estiver configurado
        if (idEspec == null || docComprovacaoNumero == null || docComprovacaoNumero.isBlank()) {
            throw new BusinessException(
                    "RN24: técnico exige id_espec e doc_comprovacao_numero");
        }
        validarUnico(email, documento);

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NotFoundException("Tenant não encontrado"));
        Role role = roleRepository.findByRoleNome("TECNICO")
                .orElseThrow(() -> new NotFoundException("Perfil TECNICO não encontrado"));
        Espec espec = especRepository.findById(idEspec)
                .orElseThrow(() -> new NotFoundException("Especialidade não encontrada"));

        // TODO: reativar quando o storage estiver configurado (remover null e descomentar a linha abaixo)
        // String url = fileStorageService.store(comprovante, "comprovacoes");
        String url = null;

        Usuario u = new Usuario();
        u.setNome(nome);
        u.setEmail(email);
        u.setTelefone(telefone);
        u.setDocumento(documento);
        u.setSenhaHash(passwordEncoder.encode(senha));
        u.setTenant(tenant);
        u.setRole(role);
        u.setEspec(espec);
        u.setDocComprovacaoNumero(docComprovacaoNumero);
        u.setDocComprovacaoUrl(url);
        u.setCadastroSts("PENDENTE");
        return UsuarioDTO.from(usuarioRepository.save(u));
    }

    // ---------------------------------------------------------------- perfil

    @Transactional(readOnly = true)
    public UsuarioDTO me() {
        return UsuarioDTO.from(currentUser.require());
    }

    @Transactional
    public UsuarioDTO atualizarMe(UpdateMeRequest req) {
        Usuario u = currentUser.require();
        if (req.nome() != null) {
            u.setNome(req.nome());
        }
        if (req.telefone() != null) {
            u.setTelefone(req.telefone());
        }
        if (req.fotoUrl() != null) {
            u.setFotoUrl(req.fotoUrl());
        }
        if (req.localizacao() != null) {
            u.setLocalizacao(GeoUtil.point(req.localizacao()));
        }
        if (req.endereco() != null) {
            u.setEndereco(salvarEndereco(req.endereco(), u.getEndereco()));
        }
        return UsuarioDTO.from(u);
    }

    @Transactional
    public UsuarioDTO alternarDisponibilidade(Boolean disponivel) {
        Usuario u = currentUser.require();
        u.setEstaDisponivel(disponivel != null ? disponivel : !u.isEstaDisponivel());
        return UsuarioDTO.from(u);
    }

    // ---------------------------------------------------------------- gestão

    @Transactional(readOnly = true)
    public UsuarioDTO detalhar(UUID id) {
        Usuario alvo = buscarVisivel(id);
        return UsuarioDTO.from(alvo);
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO> listar(String role, String status, UUID especId) {
        Usuario u = currentUser.require();
        return usuarioRepository.filtrar(tenantScope.visibleTenantIds(u), role, status, especId)
                .stream().map(UsuarioDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<UsuarioDTO> pendentes() {
        Usuario u = currentUser.require();
        return usuarioRepository
                .findByCadastroStsAndTenantIdIn("PENDENTE", tenantScope.visibleTenantIds(u))
                .stream().map(UsuarioDTO::from).toList();
    }

    @Transactional
    public UsuarioDTO aprovar(UUID id) {
        Usuario gestor = currentUser.require();
        Usuario alvo = buscarVisivel(id);
        alvo.setCadastroSts("APROVADO");
        alvo.setDataAprovacaoCadastro(OffsetDateTime.now());
        alvo.setAprovadorCadastro(gestor);
        notificationPublisher.notify(alvo.getId(), "Cadastro aprovado",
                "Seu cadastro foi aprovado pela Defesa Civil.", "SISTEMA", alvo.getId());
        return UsuarioDTO.from(alvo);
    }

    @Transactional
    public UsuarioDTO rejeitar(UUID id, String motivo) {
        Usuario alvo = buscarVisivel(id);
        alvo.setCadastroSts("REJEITADO");
        notificationPublisher.notify(alvo.getId(), "Cadastro rejeitado",
                "Seu cadastro foi rejeitado. Motivo: " + motivo, "SISTEMA", alvo.getId());
        return UsuarioDTO.from(alvo);
    }

    @Transactional
    public UsuarioDTO bloquear(UUID id) {
        Usuario alvo = buscarVisivel(id);
        alvo.setCadastroSts("BLOQUEADO");
        alvo.setActive(false);
        return UsuarioDTO.from(alvo);
    }

    /**
     * Criação de conta gerenciada (GESTOR/ADMIN). Sem escalonamento: o perfil atribuído
     * não pode ser superior ao do criador (apenas ADMIN cria ADMIN). O tenant deve estar
     * no escopo do criador.
     */
    @Transactional
    public UsuarioDTO criarGerenciado(CriarUsuarioGerenciadoRequest req) {
        Usuario criador = currentUser.require();
        Tenant tenant = tenantRepository.findById(req.tenantId())
                .orElseThrow(() -> new NotFoundException("Tenant não encontrado"));
        if (!tenantScope.canSee(criador, tenant.getId())) {
            throw new ForbiddenException("Tenant fora do seu escopo");
        }
        Role role = roleRepository.findByRoleNome(req.roleNome())
                .orElseThrow(() -> new NotFoundException("Perfil não encontrado: " + req.roleNome()));
        if (rank(req.roleNome()) > rank(criador.getRole().getRoleNome())) {
            throw new ForbiddenException("Você não pode criar uma conta com perfil acima do seu");
        }
        validarUnico(req.email(), req.documento());

        Usuario u = new Usuario();
        u.setNome(req.nome());
        u.setEmail(req.email());
        u.setTelefone(req.telefone());
        u.setDocumento(req.documento());
        u.setSenhaHash(passwordEncoder.encode(req.senha()));
        u.setTenant(tenant);
        u.setRole(role);
        u.setCadastroSts("APROVADO");
        u.setDataAprovacaoCadastro(OffsetDateTime.now());
        u.setAprovadorCadastro(criador);
        return UsuarioDTO.from(usuarioRepository.save(u));
    }

    /** Altera o perfil de um usuário (ADMIN). */
    @Transactional
    public UsuarioDTO mudarRole(UUID id, String roleNome) {
        Usuario alvo = buscarVisivel(id);
        Role role = roleRepository.findByRoleNome(roleNome)
                .orElseThrow(() -> new NotFoundException("Perfil não encontrado: " + roleNome));
        alvo.setRole(role);
        return UsuarioDTO.from(alvo);
    }

    /** Histórico de eventos atendidos por um voluntário (check-ins + triagens). */
    @Transactional(readOnly = true)
    public List<AtendimentoDTO> eventosAtendidos(UUID id) {
        buscarVisivel(id); // valida escopo de tenant
        Map<UUID, Agg> map = new LinkedHashMap<>();

        for (Checkin c : checkinRepository.findByUsuarioIdOrderByDataCheckinDesc(id)) {
            Agg a = map.computeIfAbsent(c.getEvento().getId(), k -> new Agg(c.getEvento()));
            a.checkins++;
            if (a.primeiroCheckin == null || c.getDataCheckin().isBefore(a.primeiroCheckin)) {
                a.primeiroCheckin = c.getDataCheckin();
            }
            if (c.getDataCheckout() != null
                    && (a.ultimoCheckout == null || c.getDataCheckout().isAfter(a.ultimoCheckout))) {
                a.ultimoCheckout = c.getDataCheckout();
            }
        }
        for (VitimaTriagem t : triagemRepository.findByTriadorId(id)) {
            Agg a = map.computeIfAbsent(t.getEvento().getId(), k -> new Agg(t.getEvento()));
            a.triagens++;
        }

        List<AtendimentoDTO> out = new ArrayList<>();
        for (Agg a : map.values()) {
            out.add(new AtendimentoDTO(a.evento.getId(), a.evento.getTitulo(), a.evento.getSeveridade(),
                    a.checkins, a.triagens, a.primeiroCheckin, a.ultimoCheckout));
        }
        return out;
    }

    private static final class Agg {
        final Evento evento;
        int checkins;
        int triagens;
        OffsetDateTime primeiroCheckin;
        OffsetDateTime ultimoCheckout;

        Agg(Evento evento) {
            this.evento = evento;
        }
    }

    // Ranking de perfis (espelha SecurityConfig) — evita escalonamento na criação de contas.
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

    // ---------------------------------------------------------------- monitoramento de risco (LGPD Art.7 VII)

    @Transactional(readOnly = true)
    public UsuariosEmRiscoDTO usuariosEmRisco() {
        Usuario gestor = currentUser.require();
        List<UUID> tenantIds = tenantScope.visibleTenantIds(gestor);

        List<ZonaComUsuariosDTO> zonas = new ArrayList<>();
        Set<UUID> uniqueIds = new HashSet<>();

        for (UUID tenantId : tenantIds) {
            for (ZonaRisco z : zonaRiscoRepository
                    .findByTenantIdInAndIsActiveTrueOrderByNivelRiscoDesc(List.of(tenantId))) {
                List<UsuarioLocalizacaoDTO> users = usuarioRepository
                        .usuariosEmZonaRisco(z.getId(), tenantId)
                        .stream()
                        .map(u -> {
                            uniqueIds.add(u.getId());
                            return UsuarioLocalizacaoDTO.from(u);
                        })
                        .toList();
                if (!users.isEmpty()) {
                    zonas.add(ZonaComUsuariosDTO.from(z, users));
                }
            }
        }

        List<EventoComUsuariosDTO> eventos = new ArrayList<>();
        List<Evento> eventosAtivos = eventoRepository.filtrar(tenantIds, null, null, null, false)
                .stream()
                .filter(e -> "ATIVO".equals(e.getStatus()) || "ALERTA_CRITICO".equals(e.getStatus()))
                .toList();

        for (Evento e : eventosAtivos) {
            List<UsuarioLocalizacaoDTO> users = usuarioRepository
                    .usuariosNoRaioDoEvento(e.getId(), e.getRaioMetros(), e.getTenant().getId())
                    .stream()
                    .map(u -> {
                        uniqueIds.add(u.getId());
                        return UsuarioLocalizacaoDTO.from(u);
                    })
                    .toList();
            if (!users.isEmpty()) {
                eventos.add(EventoComUsuariosDTO.from(e, users));
            }
        }

        return new UsuariosEmRiscoDTO(uniqueIds.size(), zonas, eventos);
    }

    // ---------------------------------------------------------------- helpers

    private Usuario buscarVisivel(UUID id) {
        Usuario gestor = currentUser.require();
        Usuario alvo = usuarioRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));
        if (!tenantScope.canSee(gestor, alvo.getTenant().getId())) {
            throw new ForbiddenException("Usuário fora do seu escopo de tenant");
        }
        return alvo;
    }

    private Endereco salvarEndereco(UpdateMeRequest.EnderecoInput in, Endereco existente) {
        Endereco e = existente != null ? existente : new Endereco();
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

    private void validarUnico(String email, String documento) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new BusinessException("E-mail já cadastrado");
        }
        if (usuarioRepository.existsByDocumento(documento)) {
            throw new BusinessException("Documento já cadastrado");
        }
    }
}
