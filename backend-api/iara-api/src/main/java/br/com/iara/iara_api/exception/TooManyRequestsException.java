package br.com.iara.iara_api.exception;

public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException() {
        super("Muitas tentativas. Tente novamente em instantes.");
    }
}