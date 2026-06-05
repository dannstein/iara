package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.domain.UsuarioNotificacaoPref;
import br.com.iara.iara_api.dto.usuario.NotificacaoPrefDTO;
import br.com.iara.iara_api.dto.usuario.UpdateNotificacaoPrefRequest;
import br.com.iara.iara_api.repository.UsuarioNotificacaoPrefRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificacaoPrefService {

    private final UsuarioNotificacaoPrefRepository repo;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public NotificacaoPrefDTO me() {
        Usuario u = currentUser.require();
        return NotificacaoPrefDTO.from(repo.findById(u.getId()).orElse(null));
    }

    @Transactional
    public NotificacaoPrefDTO atualizarMe(UpdateNotificacaoPrefRequest req) {
        Usuario u = currentUser.require();
        UsuarioNotificacaoPref p = repo.findById(u.getId()).orElseGet(() -> {
            UsuarioNotificacaoPref np = new UsuarioNotificacaoPref();
            np.setIdUsuario(u.getId());
            return np;
        });
        if (req.categoriasSilenciadas() != null) {
            p.setCategoriasSilenciadas(req.categoriasSilenciadas().isEmpty()
                    ? null : String.join(",", req.categoriasSilenciadas()));
        }
        if (req.severidadesSilenciadas() != null) {
            p.setSeveridadesSilenciadas(req.severidadesSilenciadas().isEmpty()
                    ? null : String.join(",", req.severidadesSilenciadas()));
        }
        if (req.naoPerturbe() != null) {
            p.setNaoPerturbe(req.naoPerturbe());
        }
        p.setUpdatedAt(OffsetDateTime.now());
        repo.save(p);
        return NotificacaoPrefDTO.from(p);
    }

    /**
     * Filtra um Set de candidatos removendo usuários que silenciaram esta
     * categoria/severidade. Severidade EMERGENCY ignora opt-outs (segurança vital).
     */
    @Transactional(readOnly = true)
    public Set<UUID> filtrarOptOuts(Set<UUID> candidatos, String categoria, String severidade) {
        if (candidatos.isEmpty()) return candidatos;
        // EMERGENCY e CRITICAL sempre passam: severidades críticas não respeitam preferências.
        if ("EMERGENCY".equals(severidade) || "CRITICAL".equals(severidade)) return candidatos;

        List<UsuarioNotificacaoPref> prefs = repo.findByIdUsuarioIn(List.copyOf(candidatos));
        Map<UUID, UsuarioNotificacaoPref> byId = prefs.stream()
                .collect(Collectors.toMap(UsuarioNotificacaoPref::getIdUsuario, p -> p));

        return candidatos.stream()
                .filter(id -> {
                    UsuarioNotificacaoPref p = byId.get(id);
                    if (p == null) return true;
                    if (p.isNaoPerturbe()) return false;
                    if (matches(p.getCategoriasSilenciadas(), categoria)) return false;
                    if (matches(p.getSeveridadesSilenciadas(), severidade)) return false;
                    return true;
                })
                .collect(Collectors.toSet());
    }

    private static boolean matches(String csv, String value) {
        if (csv == null || value == null) return false;
        for (String s : csv.split(",")) {
            if (s.trim().equals(value)) return true;
        }
        return false;
    }
}
