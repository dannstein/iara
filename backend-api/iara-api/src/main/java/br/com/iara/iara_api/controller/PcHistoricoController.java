package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.pc.PcAuditLogDTO;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.repository.PcAuditLogRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.service.DemandaService;
import br.com.iara.iara_api.service.PcService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Endpoints de histórico do PC (sub-fase 4F).
 *
 * <ul>
 *   <li>{@code /historico} — somente o coordenador do PC (toda a timeline).</li>
 *   <li>{@code /workers/{usuarioId}/atividade} — coord OU worker do PC (limitado ao ator).</li>
 * </ul>
 */
@RestController
@RequestMapping("/pontos-coleta/{pcId}")
@RequiredArgsConstructor
public class PcHistoricoController {

    private final PcAuditLogRepository auditRepository;
    private final PcService pcService;
    private final DemandaService demandaService;
    private final CurrentUser currentUser;

    @GetMapping("/historico")
    public Page<PcAuditLogDTO> historico(@PathVariable UUID pcId,
                                         @RequestParam(name = "id_evento", required = false) UUID eventoId,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "50") int size) {
        var pc = pcService.buscarVisivel(pcId);
        // Somente o coordenador do PC pode ver toda a timeline.
        var u = currentUser.require();
        if (!pc.getCoordenador().getId().equals(u.getId())) {
            throw new ForbiddenException("Apenas o coordenador pode ver o histórico completo do PC");
        }
        return auditRepository
                .historico(pcId, eventoId, PageRequest.of(page, Math.min(size, 200)))
                .map(PcAuditLogDTO::from);
    }

    @GetMapping("/workers/{usuarioId}/atividade")
    public Page<PcAuditLogDTO> atividadeWorker(@PathVariable UUID pcId,
                                               @PathVariable UUID usuarioId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "50") int size) {
        // Coord ou worker confirmado do PC.
        var pc = pcService.buscarVisivel(pcId);
        demandaService.exigirCoordOuWorker(pc);
        return auditRepository
                .atividadeWorker(pcId, usuarioId, PageRequest.of(page, Math.min(size, 200)))
                .map(PcAuditLogDTO::from);
    }
}
