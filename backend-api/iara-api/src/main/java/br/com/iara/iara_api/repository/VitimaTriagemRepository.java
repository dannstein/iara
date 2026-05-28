package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.VitimaTriagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface VitimaTriagemRepository extends JpaRepository<VitimaTriagem, UUID> {

    /** Histórico de reavaliações de uma vítima (RN13). */
    List<VitimaTriagem> findByEventoIdAndCodigoCampoOrderByCreatedAtDesc(UUID eventoId, String codigoCampo);

    /** Estado atual de cada vítima: registro mais recente por código (query 10 do DDL). */
    @Query(value = """
            select distinct on (t.codigo_campo) *
            from iara_vitima_triagem t
            where t.id_evento = :eventoId
            order by t.codigo_campo, t.created_at desc
            """, nativeQuery = true)
    List<VitimaTriagem> estadoAtualPorEvento(@Param("eventoId") UUID eventoId);

    List<VitimaTriagem> findByTriadorIdAndDataSincronizacaoIsNull(UUID triadorId);

    List<VitimaTriagem> findByTriadorId(UUID triadorId);
}
