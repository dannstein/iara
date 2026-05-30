package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.auth.TokenResponse;
import br.com.iara.iara_api.dto.usuario.*;
import br.com.iara.iara_api.dto.usuario.UsuariosEmRiscoDTO;
import br.com.iara.iara_api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;

    // ----------------------------------------------------- cadastro (público)

    @PostMapping("/cadastro/doador")
    public ResponseEntity<TokenResponse> cadastrarDoador(@Valid @RequestBody CadastroPublicoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrarDoador(req));
    }

    @PostMapping("/cadastro/simples")
    public ResponseEntity<TokenResponse> cadastrarSimples(@Valid @RequestBody CadastroPublicoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrarSimples(req));
    }

    @PostMapping("/cadastro/coordenador")
    public ResponseEntity<TokenResponse> cadastrarCoordenador(@Valid @RequestBody CadastroPublicoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.cadastrarCoordenador(req));
    }

    @PostMapping(value = "/cadastro/tecnico", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UsuarioDTO> cadastrarTecnico(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam(required = false) String telefone,
            @RequestParam String documento,
            @RequestParam String senha,
            @RequestParam UUID tenantId,
            @RequestParam UUID idEspec,
            @RequestParam String docComprovacaoNumero,
            // TODO: voltar para required = true quando o storage de arquivos estiver configurado
            @RequestPart(value = "doc_comprovacao", required = false) MultipartFile comprovante) {
        UsuarioDTO dto = service.cadastrarTecnico(nome, email, telefone, documento, senha,
                tenantId, idEspec, docComprovacaoNumero, comprovante);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(dto);
    }

    // ----------------------------------------------------- perfil

    @GetMapping("/me")
    public UsuarioDTO me() {
        return service.me();
    }

    @PutMapping("/me")
    public UsuarioDTO atualizarMe(@Valid @RequestBody UpdateMeRequest req) {
        return service.atualizarMe(req);
    }

    @PatchMapping("/me/disponibilidade")
    @PreAuthorize("hasRole('TECNICO')")
    public UsuarioDTO alternarDisponibilidade(@RequestParam(required = false) Boolean disponivel) {
        return service.alternarDisponibilidade(disponivel);
    }

    // ----------------------------------------------------- gestão

    @GetMapping("/pendentes")
    @PreAuthorize("hasRole('GESTOR')")
    public List<UsuarioDTO> pendentes() {
        return service.pendentes();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('GESTOR')")
    public UsuarioDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @GetMapping("/{id}/eventos-atendidos")
    @PreAuthorize("hasRole('GESTOR')")
    public List<AtendimentoDTO> eventosAtendidos(@PathVariable UUID id) {
        return service.eventosAtendidos(id);
    }

    @GetMapping
    @PreAuthorize("hasRole('GESTOR')")
    public List<UsuarioDTO> listar(@RequestParam(required = false) String role,
                                   @RequestParam(required = false) String status,
                                   @RequestParam(name = "especialidade", required = false) UUID especId) {
        return service.listar(role, status, especId);
    }

    @PostMapping
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<UsuarioDTO> criar(@Valid @RequestBody CriarUsuarioGerenciadoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criarGerenciado(req));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioDTO mudarRole(@PathVariable UUID id, @Valid @RequestBody MudarRoleRequest req) {
        return service.mudarRole(id, req.roleNome());
    }

    @PatchMapping("/{id}/aprovar")
    @PreAuthorize("hasRole('GESTOR')")
    public UsuarioDTO aprovar(@PathVariable UUID id) {
        return service.aprovar(id);
    }

    @PatchMapping("/{id}/rejeitar")
    @PreAuthorize("hasRole('GESTOR')")
    public UsuarioDTO rejeitar(@PathVariable UUID id, @Valid @RequestBody RejeitarCadastroRequest req) {
        return service.rejeitar(id, req.motivo());
    }

    @PatchMapping("/{id}/bloquear")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioDTO bloquear(@PathVariable UUID id) {
        return service.bloquear(id);
    }

    @GetMapping("/em-risco")
    @PreAuthorize("hasRole('GESTOR')")
    public UsuariosEmRiscoDTO usuariosEmRisco() {
        return service.usuariosEmRisco();
    }
}
