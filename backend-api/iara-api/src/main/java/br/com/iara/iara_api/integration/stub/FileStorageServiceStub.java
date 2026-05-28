package br.com.iara.iara_api.integration.stub;

import br.com.iara.iara_api.integration.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Stub de armazenamento: não persiste fisicamente, apenas devolve uma URL fake
 * coerente para o fluxo de cadastro/anexos/fotos.
 */
@Service
public class FileStorageServiceStub implements FileStorageService {

    @Override
    public String store(MultipartFile file, String pasta) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }
        String nome = UUID.randomUUID() + "-" + file.getOriginalFilename();
        return "s3://iara-dev/" + pasta + "/" + nome;
    }
}
