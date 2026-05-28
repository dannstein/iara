package br.com.iara.iara_api.security.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;

/**
 * Criptografia AES-256-GCM DETERMINÍSTICA (estilo SIV) para campos LGPD:SENSIVEL
 * que precisam de busca por igualdade e/ou UNIQUE (email, documento/CPF).
 *
 * O IV é derivado do próprio texto plano via HMAC-SHA256, garantindo que o mesmo
 * valor gere sempre o mesmo ciphertext — preservando lookups e a constraint UNIQUE.
 * Spring Data aplica este converter aos parâmetros das derived queries
 * (ex.: findByEmail), então as buscas continuam funcionando de forma transparente.
 *
 * Formato armazenado: Base64( IV(12 bytes) || ciphertext+tag ).
 */
@Converter
public class DeterministicAesConverter implements AttributeConverter<String, String> {

    private static final int IV_LEN = 12;
    private static final int TAG_BITS = 128;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            byte[] iv = deterministicIv(attribute);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, CryptoKeyProvider.dataKey(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = cipher.doFinal(attribute.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao cifrar campo LGPD determinístico", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            byte[] all = Base64.getDecoder().decode(dbData);
            byte[] iv = Arrays.copyOfRange(all, 0, IV_LEN);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, CryptoKeyProvider.dataKey(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] pt = cipher.doFinal(all, IV_LEN, all.length - IV_LEN);
            return new String(pt, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao decifrar campo LGPD determinístico", e);
        }
    }

    private byte[] deterministicIv(String plaintext) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(CryptoKeyProvider.macKey());
        byte[] full = mac.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
        return Arrays.copyOfRange(full, 0, IV_LEN);
    }
}
