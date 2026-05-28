package br.com.iara.iara_api.security;

import br.com.iara.iara_api.domain.Tenant;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.UUID;

/**
 * Visibilidade multi-tenant (DDL Seção 14 — tenant filtering):
 *   MUNICIPAL → apenas o próprio tenant
 *   ESTADUAL  → o próprio + todos os municípios filhos
 *   FEDERAL   → todos os tenants
 *   ADMIN (role) → todos os tenants, independente do tenant vinculado
 *
 * <p>Filtro de tenant ativo: um usuário multi-tenant pode focar em um único tenant
 * enviando o header {@code X-Active-Tenant: <uuid>}. Quando presente e dentro do
 * escopo base do usuário, as listagens passam a enxergar apenas aquele tenant e seus
 * descendentes. O {@link #canSee} continua usando o escopo base (não é afetado pelo
 * filtro), para não bloquear acesso direto a recursos por id nem a navegação de tenants.
 *
 * Retorna sempre uma lista concreta de IDs para uso em cláusulas {@code IN}.
 */
@Component
@RequiredArgsConstructor
public class TenantScope {

    public static final String ACTIVE_TENANT_HEADER = "X-Active-Tenant";

    private final TenantRepository tenantRepository;

    /** Escopo base do usuário (por papel/tipo de tenant), sem o filtro de tenant ativo. */
    public List<UUID> baseVisibleTenantIds(Usuario usuario) {
        if ("ADMIN".equals(usuario.getRole().getRoleNome())) {
            return tenantRepository.findAllIds();
        }
        Tenant tenant = usuario.getTenant();
        return switch (tenant.getTipo()) {
            case "MUNICIPAL" -> new ArrayList<>(List.of(tenant.getId()));
            case "ESTADUAL" -> {
                List<UUID> ids = new ArrayList<>();
                ids.add(tenant.getId());
                tenantRepository.findByPaiId(tenant.getId()).forEach(t -> ids.add(t.getId()));
                yield ids;
            }
            case "FEDERAL" -> tenantRepository.findAllIds();
            default -> new ArrayList<>(List.of(tenant.getId()));
        };
    }

    /** Escopo efetivo das listagens: base, possivelmente restrito ao tenant ativo selecionado. */
    public List<UUID> visibleTenantIds(Usuario usuario) {
        List<UUID> base = baseVisibleTenantIds(usuario);
        UUID active = activeTenantFromRequest();
        if (active != null && base.contains(active)) {
            List<UUID> subtree = subtreeIds(active);
            subtree.retainAll(base);
            return subtree.isEmpty() ? base : subtree;
        }
        return base;
    }

    /** Acesso a um tenant específico — sempre pelo escopo base (ignora o filtro ativo). */
    public boolean canSee(Usuario usuario, UUID tenantId) {
        return baseVisibleTenantIds(usuario).contains(tenantId);
    }

    /** IDs do tenant informado e de todos os seus descendentes. */
    private List<UUID> subtreeIds(UUID rootId) {
        List<UUID> ids = new ArrayList<>();
        Deque<UUID> stack = new ArrayDeque<>();
        stack.push(rootId);
        while (!stack.isEmpty()) {
            UUID cur = stack.pop();
            ids.add(cur);
            tenantRepository.findByPaiId(cur).forEach(c -> stack.push(c.getId()));
        }
        return ids;
    }

    private UUID activeTenantFromRequest() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return null;
            String header = attrs.getRequest().getHeader(ACTIVE_TENANT_HEADER);
            if (header == null || header.isBlank()) return null;
            return UUID.fromString(header.trim());
        } catch (Exception e) {
            return null; // header ausente/ inválido → sem filtro
        }
    }
}
