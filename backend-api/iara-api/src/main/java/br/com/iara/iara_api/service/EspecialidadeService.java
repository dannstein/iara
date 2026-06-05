package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Espec;
import br.com.iara.iara_api.domain.EspecCategoria;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.espec.*;
import br.com.iara.iara_api.exception.ConflictException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.EspecCategoriaRepository;
import br.com.iara.iara_api.repository.EspecRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EspecialidadeService {

    private final EspecCategoriaRepository categoriaRepository;
    private final EspecRepository especRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<CategoriaDTO> listarCategorias() {
        // Endpoint público (usado na tela de cadastro mobile, sem auth).
        // Sem usuário logado retornamos apenas categorias globais.
        UUID tenantId = optionalTenantId();
        return categoriaRepository.findGlobaisOuDoTenant(tenantId).stream()
                .map(c -> CategoriaDTO.from(c, null))
                .toList();
    }

    /** Retorna o tenant do usuário logado ou {@code null} para chamadas anônimas. */
    private UUID optionalTenantId() {
        try {
            return currentUser.tenantId();
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public CategoriaDTO detalharCategoria(UUID id) {
        EspecCategoria c = categoriaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
        List<EspecDTO> subs = especRepository.findByCategoriaIdOrderByEspecNome(id).stream()
                .map(EspecDTO::from).toList();
        return CategoriaDTO.from(c, subs);
    }

    @Transactional
    public CategoriaDTO criarCategoria(CreateCategoriaRequest req) {
        Usuario u = currentUser.require();
        EspecCategoria c = new EspecCategoria();
        c.setCatNome(req.nome());
        c.setCatDesc(req.descricao());
        c.setTenant(u.getTenant());
        return CategoriaDTO.from(categoriaRepository.save(c), List.of());
    }

    @Transactional(readOnly = true)
    public List<EspecDTO> listarEspecs(UUID idCategoria) {
        // Endpoint público (idem listarCategorias).
        UUID tenantId = optionalTenantId();
        return especRepository.findGlobaisOuDoTenant(tenantId, idCategoria).stream()
                .map(EspecDTO::from).toList();
    }

    @Transactional
    public EspecDTO criarEspec(CreateEspecRequest req) {
        Usuario u = currentUser.require();
        EspecCategoria categoria = categoriaRepository.findById(req.idCategoria())
                .orElseThrow(() -> new NotFoundException("Categoria não encontrada"));
        if (especRepository.existsByCategoriaIdAndEspecNome(categoria.getId(), req.nome())) {
            throw new ConflictException("Já existe uma especialidade com esse nome nesta categoria");
        }
        Espec e = new Espec();
        e.setCategoria(categoria);
        e.setEspecNome(req.nome());
        e.setEspecDesc(req.descricao());
        e.setTenant(u.getTenant());
        return EspecDTO.from(especRepository.save(e));
    }
}
