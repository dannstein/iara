package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.UsuarioNotificacaoPref;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UsuarioNotificacaoPrefRepository extends JpaRepository<UsuarioNotificacaoPref, UUID> {

    /**
     * Carrega prefs para o conjunto de usuários alvo. Usado pelo dispatcher
     * para filtrar opt-outs antes de criar linhas de iara_alerta_destinatario.
     */
    List<UsuarioNotificacaoPref> findByIdUsuarioIn(List<UUID> ids);
}
