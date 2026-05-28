package br.com.iara.iara_api.integration;

import org.springframework.web.multipart.MultipartFile;

/**
 * Armazena arquivos (comprovantes, anexos, fotos) e devolve a URL.
 * Implementação real (S3/MinIO) substitui o stub via profile.
 */
public interface FileStorageService {
    String store(MultipartFile file, String pasta);
}
