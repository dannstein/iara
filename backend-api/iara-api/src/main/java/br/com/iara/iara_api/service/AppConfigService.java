package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.AppConfig;
import br.com.iara.iara_api.repository.AppConfigRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Acesso de leitura/escrita ao {@code iara_app_config}. Lê com cache em memória
 * para evitar hot path no banco (DISASTER_MODE_ATIVO é consultado a cada job
 * tick). TTL: 30s — toleramos delay para propagar mudanças de admin.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AppConfigService {

    public static final String K_DISASTER_MODE = "DISASTER_MODE_ATIVO";
    public static final String K_CANAIS = "CANAIS_HABILITADOS";

    private static final long TTL_MS = 30_000;

    private final AppConfigRepository repo;
    private final CurrentUser currentUser;

    private final Map<String, String> cache = new HashMap<>();
    private long cacheLoadedAt;

    /** Lê uma chave com cache. */
    public String get(String chave) {
        refreshIfStale();
        return cache.get(chave);
    }

    public boolean isDisasterMode() {
        return "true".equalsIgnoreCase(get(K_DISASTER_MODE));
    }

    public List<String> canaisHabilitados() {
        String csv = get(K_CANAIS);
        if (csv == null || csv.isBlank()) return List.of("LOG");
        return java.util.Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    @Transactional
    public AppConfig set(String chave, String valor) {
        AppConfig c = repo.findById(chave).orElseGet(() -> {
            AppConfig nc = new AppConfig();
            nc.setChave(chave);
            return nc;
        });
        c.setValor(valor);
        c.setUpdatedAt(OffsetDateTime.now());
        try {
            c.setUpdatedBy(currentUser.require().getId());
        } catch (Exception ignored) {
            // Tolerar invocação sem contexto (ex.: bootstrap).
        }
        repo.save(c);
        invalidate();
        log.info("[AppConfig] {} = {}", chave, valor);
        return c;
    }

    @Transactional(readOnly = true)
    public Map<String, String> snapshot() {
        Map<String, String> m = new HashMap<>();
        for (AppConfig c : repo.findAll()) m.put(c.getChave(), c.getValor());
        return m;
    }

    public void invalidate() {
        cacheLoadedAt = 0;
    }

    private synchronized void refreshIfStale() {
        if (System.currentTimeMillis() - cacheLoadedAt < TTL_MS) return;
        cache.clear();
        repo.findAll().forEach(c -> cache.put(c.getChave(), c.getValor()));
        cacheLoadedAt = System.currentTimeMillis();
    }
}
