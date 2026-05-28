package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Tenant;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.tenant.*;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.TenantRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantService {

    private static final Set<String> TIPOS = Set.of("FEDERAL", "ESTADUAL", "MUNICIPAL");

    private final TenantRepository tenantRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public List<TenantDTO> listarFilhos() {
        UUID atual = currentUser.tenantId();
        return tenantRepository.findByPaiId(atual).stream().map(TenantDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public TenantDTO detalhar(UUID id) {
        Usuario u = currentUser.require();
        Tenant t = tenantRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tenant não encontrado"));
        if (!tenantScope.canSee(u, t.getId())) {
            throw new ForbiddenException("Sem acesso a este tenant");
        }
        return TenantDTO.from(t);
    }

    @Transactional
    public TenantDTO criar(CreateTenantRequest req) {
        Usuario u = currentUser.require();
        String tipo = req.tipo();

        if (!TIPOS.contains(tipo)) {
            throw new BusinessException("Tipo inválido. Use ESTADUAL ou MUNICIPAL");
        }
        // Ninguém cria tenant FEDERAL via API — é a raiz do sistema (seed).
        if ("FEDERAL".equals(tipo)) {
            throw new BusinessException("Não é permitido criar tenant FEDERAL");
        }
        if (req.uf() == null || req.uf().isBlank()) {
            throw new BusinessException("UF é obrigatória");
        }
        if ("MUNICIPAL".equals(tipo) && (req.ibgeCod() == null || req.ibgeCod().isBlank())) {
            throw new BusinessException("Código IBGE é obrigatório para tenant municipal");
        }

        Tenant pai = tenantRepository.findById(req.idPai())
                .orElseThrow(() -> new NotFoundException("Tenant pai não encontrado"));

        // Coerência hierárquica: ESTADUAL → pai FEDERAL; MUNICIPAL → pai ESTADUAL.
        if ("ESTADUAL".equals(tipo) && !"FEDERAL".equals(pai.getTipo())) {
            throw new BusinessException("Um tenant estadual deve ter um pai FEDERAL");
        }
        if ("MUNICIPAL".equals(tipo) && !"ESTADUAL".equals(pai.getTipo())) {
            throw new BusinessException("Um tenant municipal deve ter um pai ESTADUAL");
        }

        // Autorização por escopo do criador (ADMIN cria qualquer um abaixo de FEDERAL).
        boolean isAdmin = "ADMIN".equals(u.getRole().getRoleNome());
        if (!isAdmin) {
            String criadorTipo = u.getTenant().getTipo();
            switch (criadorTipo) {
                case "FEDERAL" -> { /* pode criar ESTADUAL e MUNICIPAL */ }
                case "ESTADUAL" -> {
                    if (!"MUNICIPAL".equals(tipo)) {
                        throw new ForbiddenException("Gestor estadual só pode criar tenants municipais");
                    }
                    if (!pai.getId().equals(u.getTenant().getId())) {
                        throw new ForbiddenException(
                                "Gestor estadual só pode criar municípios sob o próprio estado");
                    }
                }
                case "MUNICIPAL" ->
                        throw new ForbiddenException("Gestores municipais não podem criar tenants");
                default -> throw new ForbiddenException("Sem permissão para criar tenants");
            }
        }
        // Garante que o pai está dentro do escopo do criador (ADMIN vê tudo).
        if (!tenantScope.canSee(u, pai.getId())) {
            throw new ForbiddenException("Tenant pai fora do seu escopo");
        }

        Tenant t = new Tenant();
        t.setNome(req.nome());
        t.setTipo(tipo);
        t.setUf(req.uf());
        t.setIbgeCod(req.ibgeCod());
        t.setPai(pai);
        return TenantDTO.from(tenantRepository.save(t));
    }

    @Transactional
    public TenantDTO atualizar(UUID id, UpdateTenantRequest req) {
        Tenant t = tenantRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Tenant não encontrado"));
        t.setNome(req.nome());
        if (req.uf() != null) {
            t.setUf(req.uf());
        }
        if (req.ibgeCod() != null) {
            t.setIbgeCod(req.ibgeCod());
        }
        if (req.isActive() != null) {
            t.setActive(req.isActive());
        }
        return TenantDTO.from(t);
    }

    @Transactional(readOnly = true)
    public TenantNodeDTO hierarquia() {
        Usuario u = currentUser.require();
        // ADMIN vê a árvore inteira a partir da raiz (FEDERAL), mesmo vinculado a um tenant filho.
        if ("ADMIN".equals(u.getRole().getRoleNome())) {
            Tenant root = tenantRepository.findByPaiIsNull().stream()
                    .findFirst()
                    .orElse(u.getTenant());
            return montarNo(root);
        }
        return montarNo(u.getTenant());
    }

    private TenantNodeDTO montarNo(Tenant t) {
        List<TenantNodeDTO> filhos = tenantRepository.findByPaiId(t.getId()).stream()
                .map(this::montarNo).toList();
        return new TenantNodeDTO(t.getId(), t.getNome(), t.getTipo(), t.getUf(), filhos);
    }
}
