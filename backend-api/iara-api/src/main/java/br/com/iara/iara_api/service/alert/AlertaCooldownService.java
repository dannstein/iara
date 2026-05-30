package br.com.iara.iara_api.service.alert;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;
import java.util.UUID;

/**
 * Anti-spam de alertas: bloqueia duplicatas (mesma categoria + tenant + dedup_key)
 * dentro de uma janela curta. TTL escala com severidade — mais agressivo é mais permissivo,
 * para não bloquear emergências legítimas, mas evitar floods em alertas informativos.
 *
 * <p>Em vez de simplesmente bloquear, devolve o id do alerta anterior (se houver),
 * para o service decidir se mescla a nova requisição com ele (estende expiração + incrementa
 * merged_count) ou rejeita.
 */
@Service
@RequiredArgsConstructor
public class AlertaCooldownService {

    private static final String KEY_PREFIX = "alert:cooldown:";

    private final StringRedisTemplate redis;

    /** Resultado do check: indica se houve bloqueio e o id do alerta existente (para merge). */
    public record CooldownResult(boolean blocked, UUID existingAlertaId) {
        public static CooldownResult passed() { return new CooldownResult(false, null); }
        public static CooldownResult mergeWith(UUID id) { return new CooldownResult(true, id); }
    }

    /**
     * Espia o cooldown: se houver chave ativa, retorna o alerta id associado para o caller
     * decidir merge. NÃO grava nada. Use {@link #register} após persistir o novo alerta.
     */
    public CooldownResult peek(String categoria, UUID tenantId, String dedupKey) {
        String existing = redis.opsForValue().get(redisKey(categoria, tenantId, dedupKey));
        if (existing == null) return CooldownResult.passed();
        try {
            return CooldownResult.mergeWith(UUID.fromString(existing));
        } catch (IllegalArgumentException e) {
            return CooldownResult.passed();
        }
    }

    /** Registra/sobrescreve a chave com o alerta id, com TTL conforme severidade. */
    public void register(String categoria, UUID tenantId, String dedupKey, String severidade, UUID alertaId) {
        redis.opsForValue().set(redisKey(categoria, tenantId, dedupKey), alertaId.toString(), ttlFor(severidade));
    }

    /** Apenas verifica se há cooldown ativo (sem consumir). Usado pelo preview. */
    public boolean isActive(String categoria, UUID tenantId, String dedupKey) {
        return Boolean.TRUE.equals(redis.hasKey(redisKey(categoria, tenantId, dedupKey)));
    }

    /** Estende a janela do cooldown do alerta indicado (após merge). */
    public void extend(String categoria, UUID tenantId, String dedupKey, String severidade, UUID alertaId) {
        redis.opsForValue().set(redisKey(categoria, tenantId, dedupKey), alertaId.toString(), ttlFor(severidade));
    }

    private static String redisKey(String categoria, UUID tenantId, String dedupKey) {
        return KEY_PREFIX + categoria + ":" + tenantId + ":" + dedupKey;
    }

    /** Janela de cooldown por severidade. */
    private Duration ttlFor(String severidade) {
        return switch (Objects.toString(severidade, "INFO")) {
            case "CRITICAL", "EMERGENCY" -> Duration.ofSeconds(30);
            case "DANGER" -> Duration.ofMinutes(2);
            case "WARNING", "SOLICITATION", "OPERATIONAL" -> Duration.ofMinutes(5);
            default -> Duration.ofMinutes(10); // INFO
        };
    }

    /**
     * Gera uma chave de deduplicação razoavelmente única a partir dos campos significativos
     * para a categoria. Combinações nulas ficam como string "_".
     */
    public static String dedupKey(Object... parts) {
        StringBuilder sb = new StringBuilder();
        for (Object p : parts) {
            if (sb.length() > 0) sb.append('|');
            sb.append(p == null ? "_" : p.toString());
        }
        return sb.toString();
    }
}
