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

    public String role() {
        return require().getRole().getRoleNome();
    }
}
