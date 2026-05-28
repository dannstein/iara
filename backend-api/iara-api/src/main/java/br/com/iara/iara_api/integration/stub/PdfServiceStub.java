package br.com.iara.iara_api.integration.stub;

import br.com.iara.iara_api.integration.PdfService;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

/**
 * Stub de geração de PDF: devolve URL fake e um SHA-256 determinístico dos dados.
 */
@Service
public class PdfServiceStub implements PdfService {

    @Override
    public GeneratedPdf gerarVistoria(Map<String, Object> dados) {
        String url = "s3://iara-dev/documentos/" + UUID.randomUUID() + ".pdf";
        return new GeneratedPdf(url, sha256(String.valueOf(dados)));
    }

    private String sha256(String s) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
