package br.com.iara.iara_api.integration;

import java.util.Map;

/**
 * Gera o PDF de vistoria (RN26) e devolve a URL e o hash SHA-256 do arquivo.
 * Implementação real (biblioteca de PDF + upload) substitui o stub via profile.
 */
public interface PdfService {

    record GeneratedPdf(String urlPdf, String hashSha256) {
    }

    GeneratedPdf gerarVistoria(Map<String, Object> dados);
}
