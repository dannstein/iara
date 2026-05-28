package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.DocumentoGerado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentoGeradoRepository extends JpaRepository<DocumentoGerado, UUID> {
    List<DocumentoGerado> findBySolicitacaoId(UUID solicitacaoId);
}
