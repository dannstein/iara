package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.Pc;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.domain.ZonaRisco;
import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.repository.EventoRepository;
import br.com.iara.iara_api.repository.PcRepository;
import br.com.iara.iara_api.repository.UsuarioRepository;
import br.com.iara.iara_api.repository.ZonaRiscoRepository;
import lombok.RequiredArgsConstructor;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Calcula o conjunto de usuários-alvo (Set<UUID>) para cada categoria de alerta.
 * Reaproveita queries geoespaciais já existentes em UsuarioRepository, PcRepository,
 * EventoRepository, ZonaRiscoRepository.
 */
@Service
@RequiredArgsConstructor
public class AlertaTargetingService {

    private final UsuarioRepository usuarioRepository;
    private final EventoRepository eventoRepository;
    private final ZonaRiscoRepository zonaRiscoRepository;
    private final PcRepository pcRepository;

    private static final int DEFAULT_NEAR_RADIUS = 5000; // 5 km

    @Transactional(readOnly = true)
    public Set<UUID> targetDangerZone(UUID zonaId, boolean todasZonas, List<String> geofenceModes,
                                       Integer raioMetros, List<UUID> tenantIds) {
        return targetDangerZone(zonaId, todasZonas, geofenceModes, raioMetros, tenantIds, null, null, null);
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetDangerZone(UUID zonaId, boolean todasZonas, List<String> geofenceModes,
                                       Integer raioMetros, List<UUID> tenantIds,
                                       Integer lastHours, Integer frequentMinDays, Integer frequentLastDays) {
        Set<UUID> result = new HashSet<>();
        List<ZonaRisco> zonas = todasZonas
                ? zonaRiscoRepository.findByTenantIdInAndIsActiveTrueOrderByNivelRiscoDesc(tenantIds)
                : List.of(zonaRiscoRepository.findById(zonaId).orElseThrow());

        for (ZonaRisco z : zonas) {
            UUID tenantId = z.getTenant().getId();
            if (!tenantIds.contains(tenantId)) continue;
            int raio = raioMetros != null ? raioMetros : (z.getRaioMetros() != null ? z.getRaioMetros() : DEFAULT_NEAR_RADIUS);

            if (geofenceModes.contains("INSIDE")) {
                for (Usuario u : usuarioRepository.usuariosEmZonaRisco(z.getId(), tenantId)) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("HOME")) {
                for (Usuario u : usuarioRepository.usuariosComEnderecoEmZonaRisco(z.getId(), tenantId)) {
                    result.add(u.getId());
                }
            }
            Point center = null;
            if (geofenceModes.contains("NEAR") || geofenceModes.contains("PASSED_THROUGH") || geofenceModes.contains("FREQUENT")) {
                center = centerOf(z.getGeometria());
            }
            if (geofenceModes.contains("NEAR") && center != null) {
                for (Usuario u : usuarioRepository.usuariosNoRaio(center.getY(), center.getX(), raio, List.of(tenantId))) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("PASSED_THROUGH") && center != null) {
                int hours = lastHours != null ? lastHours : 24;
                for (Usuario u : usuarioRepository.usuariosQuePassaramPela(center.getY(), center.getX(), raio, hours, List.of(tenantId))) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("FREQUENT") && center != null) {
                int minDays = frequentMinDays != null ? frequentMinDays : 5;
                int lastDays = frequentLastDays != null ? frequentLastDays : 30;
                for (Usuario u : usuarioRepository.usuariosFrequentesNo(center.getY(), center.getX(), raio, minDays, lastDays, List.of(tenantId))) {
                    result.add(u.getId());
                }
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetEventZone(UUID eventoId, boolean todosEventos, List<String> geofenceModes,
                                      Integer raioMetros, List<UUID> tenantIds) {
        return targetEventZone(eventoId, todosEventos, geofenceModes, raioMetros, tenantIds, null, null, null);
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetEventZone(UUID eventoId, boolean todosEventos, List<String> geofenceModes,
                                      Integer raioMetros, List<UUID> tenantIds,
                                      Integer lastHours, Integer frequentMinDays, Integer frequentLastDays) {
        Set<UUID> result = new HashSet<>();
        List<Evento> eventos;
        if (todosEventos) {
            eventos = eventoRepository.filtrar(tenantIds, "ATIVO", null, null, false);
            eventos.addAll(eventoRepository.filtrar(tenantIds, "ALERTA_CRITICO", null, null, false));
        } else {
            eventos = List.of(eventoRepository.findById(eventoId).orElseThrow());
        }

        for (Evento e : eventos) {
            UUID tenantId = e.getTenant().getId();
            if (!tenantIds.contains(tenantId)) continue;
            int raio = raioMetros != null ? raioMetros : e.getRaioMetros();

            if (geofenceModes.contains("INSIDE")) {
                for (Usuario u : usuarioRepository.usuariosNoRaioDoEvento(e.getId(), e.getRaioMetros(), tenantId)) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("NEAR")) {
                for (Usuario u : usuarioRepository.usuariosNoRaioDoEvento(e.getId(), raio, tenantId)) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("HOME")) {
                for (Usuario u : usuarioRepository.usuariosComEnderecoNoRaioDoEvento(e.getId(), raio, tenantId)) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("PASSED_THROUGH") && e.getCoordenadas() != null) {
                int hours = lastHours != null ? lastHours : 24;
                double lat = e.getCoordenadas().getY();
                double lng = e.getCoordenadas().getX();
                for (Usuario u : usuarioRepository.usuariosQuePassaramPela(lat, lng, raio, hours, List.of(tenantId))) {
                    result.add(u.getId());
                }
            }
            if (geofenceModes.contains("FREQUENT") && e.getCoordenadas() != null) {
                int minDays = frequentMinDays != null ? frequentMinDays : 5;
                int lastDays = frequentLastDays != null ? frequentLastDays : 30;
                double lat = e.getCoordenadas().getY();
                double lng = e.getCoordenadas().getX();
                for (Usuario u : usuarioRepository.usuariosFrequentesNo(lat, lng, raio, minDays, lastDays, List.of(tenantId))) {
                    result.add(u.getId());
                }
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetTenantBroadcast(UUID tenantAlvo, String targetRole, List<UUID> visibleTenantIds) {
        if (!visibleTenantIds.contains(tenantAlvo)) {
            return Collections.emptySet();
        }
        Set<UUID> result = new HashSet<>();
        for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(tenantAlvo), targetRole)) {
            result.add(u.getId());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetTechnicians(UUID eventoId, UUID especId, Integer raioMetros, boolean tenantWide,
                                        List<UUID> tenantIds) {
        Evento e = eventoRepository.findById(eventoId).orElseThrow();
        UUID tenantId = e.getTenant().getId();
        if (!tenantIds.contains(tenantId)) return Collections.emptySet();

        Set<UUID> result = new HashSet<>();

        if (tenantWide) {
            // Todos os técnicos disponíveis do tenant, com ou sem especialidade
            for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(tenantId), "TECNICO")) {
                if (u.isEstaDisponivel() && (especId == null || (u.getEspec() != null && u.getEspec().getId().equals(especId)))) {
                    result.add(u.getId());
                }
            }
            return result;
        }

        int raio = raioMetros != null ? raioMetros : e.getRaioMetros();
        double lat = e.getCoordenadas().getY();
        double lng = e.getCoordenadas().getX();
        String especStr = especId != null ? especId.toString() : null;
        for (Usuario u : usuarioRepository.tecnicosDisponiveis(lat, lng, raio, especStr)) {
            if (tenantId.equals(u.getTenant().getId())) {
                result.add(u.getId());
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetCollectionPoints(UUID eventoId, String escopoTipo, Integer raioMetros,
                                             List<UUID> tenantIds) {
        Set<UUID> result = new HashSet<>();
        Evento e = eventoRepository.findById(eventoId).orElseThrow();
        UUID tenantId = e.getTenant().getId();
        if (!tenantIds.contains(tenantId)) return result;

        if ("TENANT".equals(escopoTipo)) {
            // Todos os coordenadores ativos do tenant
            for (Pc pc : pcRepository.filtrar(List.of(tenantId), true, null, null, null)) {
                if (pc.getCoordenador() != null) result.add(pc.getCoordenador().getId());
            }
            return result;
        }

        // Default: PCs no raio do evento (igual à notificação automática existente)
        int raio = raioMetros != null ? raioMetros : e.getRaioMetros();
        for (Pc pc : pcRepository.ativosNoRaioDoEvento(eventoId, raio)) {
            if (pc.getCoordenador() != null) result.add(pc.getCoordenador().getId());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetSupportPoints(UUID zonaId, String escopoTipo, Integer raioMetros,
                                          List<UUID> tenantIds) {
        // PontoApoioGeral não tem usuário responsável (campo "responsavel" é varchar).
        // Em Fase 1, notificamos os GESTORes do tenant onde o ponto de apoio existe.
        // O alcance é: tenant do zona/raio.
        ZonaRisco z = zonaRiscoRepository.findById(zonaId).orElseThrow();
        UUID tenantId = z.getTenant().getId();
        if (!tenantIds.contains(tenantId)) return Collections.emptySet();
        Set<UUID> result = new HashSet<>();
        for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(tenantId), "GESTOR")) {
            result.add(u.getId());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetMonitors(UUID eventoId, UUID zonaId, String escopoTipo, Integer raioMetros,
                                     List<UUID> tenantIds) {
        Set<UUID> result = new HashSet<>();

        // Para escopo TENANT, todos os monitores dos tenants visíveis
        if ("TENANT".equals(escopoTipo) || (eventoId == null && zonaId == null)) {
            for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(tenantIds, "MONITOR")) {
                result.add(u.getId());
            }
            return result;
        }

        // Escopo RAIO: monitores do tenant cujo evento/zona pertence + filtro espacial via localização
        if (eventoId != null) {
            Evento e = eventoRepository.findById(eventoId).orElseThrow();
            UUID tenantId = e.getTenant().getId();
            if (!tenantIds.contains(tenantId)) return result;
            int raio = raioMetros != null ? raioMetros : e.getRaioMetros();
            double lat = e.getCoordenadas().getY();
            double lng = e.getCoordenadas().getX();
            for (Usuario u : usuarioRepository.usuariosNoRaio(lat, lng, raio, List.of(tenantId))) {
                if ("MONITOR".equals(u.getRole().getRoleNome())) result.add(u.getId());
            }
            // E também os monitores sem localização (não excluir somente porque não compartilharam coord)
            for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(tenantId), "MONITOR")) {
                if (u.getLocalizacao() == null) result.add(u.getId());
            }
            return result;
        }

        ZonaRisco z = zonaRiscoRepository.findById(zonaId).orElseThrow();
        UUID tenantId = z.getTenant().getId();
        if (!tenantIds.contains(tenantId)) return result;
        Point center = centerOf(z.getGeometria());
        if (center != null) {
            int raio = raioMetros != null ? raioMetros
                    : (z.getRaioMetros() != null ? z.getRaioMetros() : DEFAULT_NEAR_RADIUS);
            for (Usuario u : usuarioRepository.usuariosNoRaio(center.getY(), center.getX(), raio, List.of(tenantId))) {
                if ("MONITOR".equals(u.getRole().getRoleNome())) result.add(u.getId());
            }
        }
        for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(tenantId), "MONITOR")) {
            if (u.getLocalizacao() == null) result.add(u.getId());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetPersonalized(CoordenadasDTO coordenadas, Integer raioMetros, List<String> geofenceModes,
                                         String targetRole, UUID tenantAlvo, List<UUID> tenantIds) {
        return targetPersonalized(coordenadas, raioMetros, geofenceModes, targetRole, tenantAlvo, tenantIds,
                null, null, null);
    }

    @Transactional(readOnly = true)
    public Set<UUID> targetPersonalized(CoordenadasDTO coordenadas, Integer raioMetros, List<String> geofenceModes,
                                         String targetRole, UUID tenantAlvo, List<UUID> tenantIds,
                                         Integer lastHours, Integer frequentMinDays, Integer frequentLastDays) {
        Set<UUID> result = new HashSet<>();

        // Sem coordenadas → trata como broadcast para tenant alvo + role
        if (coordenadas == null) {
            UUID alvo = tenantAlvo != null ? tenantAlvo
                    : (tenantIds.isEmpty() ? null : tenantIds.get(0));
            if (alvo == null) return result;
            if (!tenantIds.contains(alvo)) return result;
            for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(alvo), targetRole)) {
                result.add(u.getId());
            }
            return result;
        }

        List<String> modes = geofenceModes != null && !geofenceModes.isEmpty()
                ? geofenceModes : List.of("INSIDE", "NEAR");
        int raio = raioMetros != null ? raioMetros : DEFAULT_NEAR_RADIUS;
        List<UUID> scopeTenants = tenantAlvo != null && tenantIds.contains(tenantAlvo)
                ? List.of(tenantAlvo) : tenantIds;

        if (modes.contains("INSIDE") || modes.contains("NEAR")) {
            for (Usuario u : usuarioRepository.usuariosNoRaio(coordenadas.lat(), coordenadas.lng(), raio, scopeTenants)) {
                if (targetRole == null || targetRole.equals(u.getRole().getRoleNome())) {
                    result.add(u.getId());
                }
            }
        }
        if (modes.contains("HOME")) {
            for (Usuario u : usuarioRepository.usuariosComEnderecoNoRaio(coordenadas.lat(), coordenadas.lng(), raio, scopeTenants)) {
                if (targetRole == null || targetRole.equals(u.getRole().getRoleNome())) {
                    result.add(u.getId());
                }
            }
        }
        if (modes.contains("PASSED_THROUGH")) {
            int hours = lastHours != null ? lastHours : 24;
            for (Usuario u : usuarioRepository.usuariosQuePassaramPela(coordenadas.lat(), coordenadas.lng(), raio, hours, scopeTenants)) {
                if (targetRole == null || targetRole.equals(u.getRole().getRoleNome())) {
                    result.add(u.getId());
                }
            }
        }
        if (modes.contains("FREQUENT")) {
            int minDays = frequentMinDays != null ? frequentMinDays : 5;
            int lastDays = frequentLastDays != null ? frequentLastDays : 30;
            for (Usuario u : usuarioRepository.usuariosFrequentesNo(coordenadas.lat(), coordenadas.lng(), raio, minDays, lastDays, scopeTenants)) {
                if (targetRole == null || targetRole.equals(u.getRole().getRoleNome())) {
                    result.add(u.getId());
                }
            }
        }
        return result;
    }

    /** Devolve o ponto representativo (centroide ou próprio ponto) de uma geometria. */
    private static Point centerOf(Geometry geom) {
        if (geom == null) return null;
        if (geom instanceof Point p) return p;
        return geom.getCentroid();
    }

    /** Alvo do escalonamento: todos os GESTORes do tenant ancestral indicado. */
    @Transactional(readOnly = true)
    public Set<UUID> targetEscalation(UUID tenantAncestralId) {
        Set<UUID> result = new HashSet<>();
        for (Usuario u : usuarioRepository.aprovadosPorTenantsERole(List.of(tenantAncestralId), "GESTOR")) {
            result.add(u.getId());
        }
        return result;
    }
}
