package br.com.iara.iara_api.exception;

/**
 * Violação de regra de negócio → HTTP 422 (RN14, RN17, XOR de apoio, mínimo de fotos, etc.).
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
