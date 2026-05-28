package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.servico.PrioridadeRequest;
import br.com.iara.iara_api.dto.servico.SolicitacaoHistoricoDTO;
import br.com.iara.iara_api.dto.servico.SolicitacaoServicoDTO;
import br.com.iara.iara_api.dto.servico.TransicaoRequest;
import br.com.iara.iara_api.service.SolicitacaoServicoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/solicitacoes-servico")
@RequiredArgsConstructor
public class SolicitacaoServicoController {

    private final SolicitacaoServicoService service;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SolicitacaoServicoDTO> criar(
            @RequestParam String tipo,
            @RequestParam String enderecoTxt,
            @RequestParam String descricaoMotivo,
            @RequestParam("fotos") List<MultipartFile> fotos) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.criar(tipo, enderecoTxt, descricaoMotivo, fotos));
    }

    @GetMapping("/minhas")
    public List<SolicitacaoServicoDTO> minhas() {
        return service.minhas();
    }

    @GetMapping
    @PreAuthorize("hasRole('MONITOR')")
    public List<SolicitacaoServicoDTO> listar() {
        return service.listarTenant();
    }

    @GetMapping("/{id}")
    public SolicitacaoServicoDTO detalhar(@PathVariable UUID id) {
        return service.detalhar(id);
    }

    @GetMapping("/{id}/historico")
    @PreAuthorize("hasRole('MONITOR')")
    public List<SolicitacaoHistoricoDTO> historico(@PathVariable UUID id) {
        return service.historico(id);
    }

    @PatchMapping("/{id}/revisar")
    @PreAuthorize("hasRole('MONITOR')")
    public SolicitacaoServicoDTO revisar(@PathVariable UUID id,
                                         @RequestBody(required = false) TransicaoRequest req) {
        return service.revisar(id, req != null ? req.observacao() : null);
    }

    @PatchMapping("/{id}/assumir")
    @PreAuthorize("hasRole('MONITOR')")
    public SolicitacaoServicoDTO assumir(@PathVariable UUID id,
                                         @RequestBody(required = false) TransicaoRequest req) {
        return service.assumir(id, req != null ? req.observacao() : null);
    }

    @PatchMapping("/{id}/concluir")
    @PreAuthorize("hasRole('MONITOR')")
    public SolicitacaoServicoDTO concluir(@PathVariable UUID id,
                                          @RequestBody(required = false) TransicaoRequest req) {
        return service.concluir(id, req != null ? req.observacao() : null);
    }

    @PatchMapping("/{id}/indeferir")
    @PreAuthorize("hasRole('MONITOR')")
    public SolicitacaoServicoDTO indeferir(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return service.indeferir(id, body.get("parecer"));
    }

    @PatchMapping("/{id}/prioridade")
    @PreAuthorize("hasRole('MONITOR')")
    public SolicitacaoServicoDTO prioridade(@PathVariable UUID id,
                                            @Valid @RequestBody PrioridadeRequest req) {
        return service.setPrioridade(id, req.prioridade());
    }
}
