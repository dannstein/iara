package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.InformeCampo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface InformeCampoRepository extends JpaRepository<InformeCampo, UUID> {

    @Query("""
            select i from InformeCampo i
            where i.evento.id = :eventoId
              and (:canal is null or i.canalEnvio = :canal)
            order by i.createdAt desc
            """)
    List<InformeCampo> listar(@Param("eventoId") UUID eventoId, @Param("canal") String canal);

    List<InformeCampo> findByUsuarioIdAndDataSincronizacaoIsNull(UUID usuarioId);
}
