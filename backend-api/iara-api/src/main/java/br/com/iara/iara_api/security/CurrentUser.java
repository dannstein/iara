package br.com.iara.iara_api.security;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolve o usuário autenticado a partir do SecurityContext.
 * O principal carrega o e-mail (subject do JWT); a entidade Usuario completa
 * (com tenant, role e especialidade) é carregada do banco quando necessária.
 */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UsuarioRepository usuarioRepository;

    public Usuario require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ForbiddenException("Não autenticado");
        }
        return usuarioRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ForbiddenException("Usuário autenticado não encontrado"));
    }

    public UUID id() {
        return require().getId();
    }

    public UUID tenantId() {
        return require().getTenant().getId();
    }

    /**
     * Retorna o tenantId do usuario autenticado, ou null se nao houver sessao.
     * Usado em endpoints publicos que filtram por tenant quando disponivel
     * (ex: GET /especialidades no fluxo de cadastro de voluntario sem token).
     */
    public UUID tenantIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return usuarioRepository.findByEmail(auth.getName())
                .map(u -> u.getTenant().getId())
                .orElse(null);
    }

    public String role() {
        return require().getRole().getRoleNome();
    }
}
