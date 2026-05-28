package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Role;
import br.com.iara.iara_api.domain.Tenant;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.auth.*;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.repository.RoleRepository;
import br.com.iara.iara_api.repository.TenantRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import br.com.iara.iara_api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Set<String> MOBILE_REGISTER_ROLES = Set.of("DOADOR", "TECNICO", "COORDENADOR");
    private static final Set<String> MOBILE_LOGIN_ROLES    = Set.of("DOADOR", "TECNICO", "COORDENADOR", "MONITOR", "GESTOR", "ADMIN");
    private static final Set<String> WEB_LOGIN_ROLES       = Set.of("GESTOR", "ADMIN");
    private static final Set<String> WEB_REGISTER_ROLES    = Set.of("GESTOR");

    private final UsuarioRepository usuarioRepository;
    private final TenantRepository tenantRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenService refreshTokenService;
    private final RateLimitService rateLimitService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // @Lazy prevents circular dependency: SecurityConfig → AuthenticationManager → UserDetailsService
    @Lazy
    @Autowired
    private AuthenticationManager authManager;

    @Transactional
    public TokenResponse loginMobile(LoginRequest req, String ip) {
        rateLimitService.checkAndIncrement(ip);
        doAuthenticate(req.email(), req.senha());
        rateLimitService.reset(ip);

        Usuario usuario = usuarioRepository.findByEmail(req.email()).orElseThrow();
        if (!MOBILE_LOGIN_ROLES.contains(usuario.getRole().getRoleNome())) {
            throw new ForbiddenException("Acesso mobile não permitido para este perfil");
        }
        return refreshTokenService.issueTokenPair(usuario);
    }

    @Transactional
    public TokenResponse loginWeb(LoginRequest req, String ip) {
        rateLimitService.checkAndIncrement(ip);
        doAuthenticate(req.email(), req.senha());
        rateLimitService.reset(ip);

        Usuario usuario = usuarioRepository.findByEmail(req.email()).orElseThrow();
        if (!WEB_LOGIN_ROLES.contains(usuario.getRole().getRoleNome())) {
            throw new ForbiddenException("Acesso via web não permitido para este perfil");
        }
        return refreshTokenService.issueTokenPair(usuario);
    }

    @Transactional
    public TokenResponse registerMobile(MobileRegisterRequest req) {
        if (!MOBILE_REGISTER_ROLES.contains(req.roleNome())) {
            throw new IllegalArgumentException(
                    "Perfil inválido para cadastro mobile. Permitidos: DOADOR, TECNICO, COORDENADOR");
        }

        validateUnique(req.email(), req.documento());

        Tenant tenant = tenantRepository.findById(req.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado"));
        Role role = roleRepository.findByRoleNome(req.roleNome())
                .orElseThrow(() -> new IllegalArgumentException("Perfil não encontrado: " + req.roleNome()));

        Usuario usuario = buildUsuario(req.nome(), req.email(), req.senha(),
                req.documento(), req.telefone(), tenant, role);
        usuarioRepository.save(usuario);

        return refreshTokenService.issueTokenPair(usuario);
    }

    @Transactional
    public TokenResponse registerWeb(WebRegisterRequest req) {
        if (!WEB_REGISTER_ROLES.contains(req.roleNome())) {
            throw new IllegalArgumentException(
                    "Perfil inválido para cadastro web. Permitido: GESTOR");
        }

        validateUnique(req.email(), req.documento());

        Tenant tenant = tenantRepository.findById(req.tenantId())
                .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado"));
        Role role = roleRepository.findByRoleNome(req.roleNome())
                .orElseThrow(() -> new IllegalArgumentException("Perfil não encontrado: " + req.roleNome()));

        Usuario usuario = buildUsuario(req.nome(), req.email(), req.senha(),
                req.documento(), req.telefone(), tenant, role);
        usuarioRepository.save(usuario);

        return refreshTokenService.issueTokenPair(usuario);
    }

    @Transactional
    public TokenResponse refresh(String refreshTokenValue) {
        return refreshTokenService.rotateTokens(refreshTokenValue);
    }

    @Transactional
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && jwtUtil.isValid(accessToken)) {
            String jti = jwtUtil.extractJti(accessToken);
            String email = jwtUtil.extractEmail(accessToken);
            usuarioRepository.findByEmail(email).ifPresent(usuario ->
                    refreshTokenService.blacklistJti(jti, jwtUtil.extractExpiration(accessToken), usuario));
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
    }

    private void doAuthenticate(String email, String senha) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(email, senha));
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Credenciais inválidas");
        }
        // LockedException and DisabledException propagate as-is to GlobalExceptionHandler
    }

    private void validateUnique(String email, String documento) {
        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("E-mail já cadastrado");
        }
        if (usuarioRepository.existsByDocumento(documento)) {
            throw new IllegalArgumentException("Documento já cadastrado");
        }
    }

    private Usuario buildUsuario(String nome, String email, String senha,
                                  String documento, String telefone, Tenant tenant, Role role) {
        Usuario usuario = new Usuario();
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setDocumento(documento);
        usuario.setTelefone(telefone);
        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuario.setTenant(tenant);
        usuario.setRole(role);
        usuario.setCadastroSts("PENDENTE");
        return usuario;
    }
}