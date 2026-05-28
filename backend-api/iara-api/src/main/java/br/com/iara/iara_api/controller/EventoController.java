package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.evento.*;
import br.com.iara.iara_api.dto.pc.PcDTO;
import br.com.iara.iara_api.service.EventoService;
import br.com.iara.iara_api.service.PcService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/eventos")
@RequiredArgsConstructor
public class EventoController {

    private final EventoService service;
    private final PcService pcService;

    // ---- 5.1 CRUD / ciclo de vida ----

    @PostMapping
    @PreAuthorize("hasRole('TECNICO')")
    public ResponseEntity<EventoDTO> criar(@Valid @RequestBody CreateEventoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(req));
    }

    @GetMapping
    public List<EventoDTO> listar(@RequestParam(required = false) String status,
                                  @RequestParam(required = false) String severidade,
                                  @RequestParam(name = "tipo", required = false) UUID tipoId,
                                  @RequestParam(name = "is_simulado", required = false) Boolean isSimulado) {
        return service.listar(status, severidade, tipoId, isSimulado);
    }

    @GetMapping("/{id}")
    public EventoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    /** PCs vinculados ao evento (padrão: os que aceitaram — status ACEITO). */
    @GetMapping("/{id}/pontos-coleta")
    @PreAuthorize("hasRole('MONITOR')")
    public List<PcDTO> pontosColeta(@PathVariable UUID id,
                                    @RequestParam(required = false, defaultValue = "ACEITO") String status) {
        return pcService.pontosColetaDoEvento(id, status);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MONITOR')")
    public EventoDTO atualizar(@PathVariable UUID id, @Valid @RequestBody UpdateEventoRequest req) {
        return service.atualizar(id, req);
    }

    @PatchMapping("/{id}/aprovar")
    @PreAuthorize("hasRole('GESTOR')")
    public EventoDTO aprovar(@PathVariable UUID id) {
        return service.aprovar(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('GESTOR')")
    public EventoDTO mudarStatus(@PathVariable UUID id, @Valid @RequestBody StatusRequest req) {
        return service.mudarStatus(id, req);
    }

    @PatchMapping("/{id}/cancelar")
    @PreAuthorize("hasRole('GESTOR')")
    public EventoDTO cancelar(@PathVariable UUID id, @RequestBody(required = false) Map<String, String> body) {
        return service.cancelar(id, body != null ? body.get("observacao") : null);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> remover(@PathVariable UUID id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }

    // ---- 5.2 FIDE / S2ID ----

    @GetMapping("/{id}/fide")
    @PreAuthorize("hasRole('GESTOR')")
    public FideDTO obterFide(@PathVariable UUID id) {
        return service.obterFide(id);
    }

    @PutMapping("/{id}/fide")
    @PreAuthorize("hasRole('GESTOR')")
    public FideDTO atualizarFide(@PathVariable UUID id, @Valid @RequestBody UpdateFideRequest req) {
        return service.atualizarFide(id, req);
    }

    @GetMapping("/{id}/fide/validar")
    @PreAuthorize("hasRole('GESTOR')")
    public FideValidacaoDTO validarFide(@PathVariable UUID id) {
        return service.validarFide(id);
    }

    @PatchMapping("/{id}/fide/submeter")
    @PreAuthorize("hasRole('GESTOR')")
    public FideDTO submeterFide(@PathVariable UUID id) {
        return service.submeterFide(id);
    }

    // ---- 5.3 upvotes / histórico / avaliação ----

    @PostMapping("/{id}/upvote")
    @PreAuthorize("hasRole('TECNICO')")
    public Map<String, Long> adicionarUpvote(@PathVariable UUID id) {
        return Map.of("upvotes", service.adicionarUpvote(id));
    }

    @DeleteMapping("/{id}/upvote")
    @PreAuthorize("hasRole('TECNICO')")
    public Map<String, Long> removerUpvote(@PathVariable UUID id) {
        return Map.of("upvotes", service.removerUpvote(id));
    }

    @GetMapping("/{id}/historico")
    @PreAuthorize("hasRole('MONITOR')")
    public List<HistoricoDTO> historico(@PathVariable UUID id) {
        return service.historico(id);
    }

    @PostMapping("/{id}/avaliacao")
    @PreAuthorize("hasRole('COORDENADOR')")
    public ResponseEntity<AvaliacaoDTO> avaliar(@PathVariable UUID id, @Valid @RequestBody AvaliacaoRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.avaliar(id, req));
    }

    @GetMapping("/{id}/avaliacao")
    @PreAuthorize("hasRole('GESTOR')")
    public List<AvaliacaoDTO> listarAvaliacoes(@PathVariable UUID id) {
        return service.listarAvaliacoes(id);
    }

    // ---- 5.4 especialidades necessárias / match ----

    @PostMapping("/{id}/especialidades")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<EspecNecessariaDTO> declararEspec(@PathVariable UUID id,
                                                            @Valid @RequestBody EspecNecessariaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.declararEspec(id, req));
    }

    @GetMapping("/{id}/especialidades")
    @PreAuthorize("hasRole('MONITOR')")
    public List<EspecNecessariaDTO> listarEspecs(@PathVariable UUID id) {
        return service.listarEspecs(id);
    }

    @PutMapping("/{id}/especialidades/{especId}")
    @PreAuthorize("hasRole('GESTOR')")
    public EspecNecessariaDTO atualizarEspec(@PathVariable UUID id, @PathVariable UUID especId,
                                             @Valid @RequestBody EspecNecessariaRequest req) {
        return service.atualizarEspec(id, especId, req);
    }

    @DeleteMapping("/{id}/especialidades/{especId}")
    @PreAuthorize("hasRole('GESTOR')")
    public ResponseEntity<Void> removerEspec(@PathVariable UUID id, @PathVariable UUID especId) {
        service.removerEspec(id, especId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/tecnicos-disponiveis")
    @PreAuthorize("hasRole('GESTOR')")
    public List<TecnicoDisponivelDTO> tecnicosDisponiveis(
            @PathVariable UUID id,
            @RequestParam(name = "id_espec", required = false) UUID especId,
            @RequestParam(name = "raio_metros", required = false) Integer raioMetros) {
        return service.tecnicosDisponiveis(id, especId, raioMetros);
    }
}
