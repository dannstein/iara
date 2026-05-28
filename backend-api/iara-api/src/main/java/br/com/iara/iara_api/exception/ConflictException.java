package br.com.iara.iara_api.exception;

import lombok.Getter;

import java.util.Map;

/**
 * Conflito de regra de negócio → HTTP 409 (abrigo lotado, upvote duplicado, pré-condição não atendida).
 * Pode carregar dados extras (ex.: flag priority_blocked do RN12).
 */
@Getter
public class ConflictException extends RuntimeException {

    private final transient Map<String, Object> extra;

    public ConflictException(String message) {
        this(message, Map.of());
    }

    public ConflictException(String message, Map<String, Object> extra) {
        super(message);
        this.extra = extra;
    }
}
