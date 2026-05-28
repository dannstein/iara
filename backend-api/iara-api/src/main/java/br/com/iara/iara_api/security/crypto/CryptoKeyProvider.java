package br.com.iara.iara_api.security.crypto;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/**
 * Fornece as chaves AES usadas pelos AttributeConverter de LGPD.
 *
 * Os converters são instanciados pelo Hibernate (fora do contexto Spring),
 * por isso a chave é lida diretamente da variável de ambiente
 * {@code IARA_ENCRYPTION_KEY} (Base64 de 32 bytes), com fallback de dev.
 */
final class CryptoKeyProvider {

    private static final String ENV = "IARA_ENCRYPTION_KEY";
    // Fallback de desenvolvimento — 32 bytes Base64. Em produção defina IARA_ENCRYPTION_KEY.
    private static final String DEV_FALLBACK = "aWFyYS1kZXYtbGdwZC1hZXMtMjU2LWtleS0zMmJ5dGU=";

    private static final SecretKeySpec DATA_KEY;
    private static final SecretKeySpec MAC_KEY;

    static {
        byte[] key = resolveKey();
        if (key.length != 32) {
            throw new IllegalStateException(ENV + " deve decodificar para exatamente 32 bytes (AES-256)");
        }
        DATA_KEY = new SecretKeySpec(key, "AES");
        MAC_KEY = new SecretKeySpec(sha256(concat(key, "iara-mac".getBytes(StandardCharsets.UTF_8))), "HmacSHA256");
    }

    private CryptoKeyProvider() {
    }

    static SecretKeySpec dataKey() {
        return DATA_KEY;
    }

    static SecretKeySpec macKey() {
        return MAC_KEY;
    }

    private static byte[] resolveKey() {
        String configured = System.getenv(ENV);
        if (configured == null || configured.isBlank()) {
            configured = System.getProperty(ENV, DEV_FALLBACK);
        }
        return Base64.getDecoder().decode(configured);
    }

    private static byte[] sha256(byte[] data) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(data);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] out = new byte[a.length + b.length];
        System.arraycopy(a, 0, out, 0, a.length);
        System.arraycopy(b, 0, out, a.length, b.length);
        return out;
    }
}
