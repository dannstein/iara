package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.SetorOperacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SetorOperacaoRepository extends JpaRepository<SetorOperacao, UUID> {

    List<SetorOperacao> findByEventoId(UUID eventoId);

    Optional<SetorOperacao> findByEventoIdAndTipo(UUID eventoId, String tipo);

    /** Setor (query 4 do DDL) que contém a coordenada, se houver. */
    @Query(value = """
            select * from iara_setor_operacao s
            where s.id_evento = :eventoId
              and ST_Contains(s.geometria, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))
            limit 1
            """, nativeQuery = true)
    Optional<SetorOperacao> setorDaCoordenada(@Param("eventoId") UUID eventoId,
                                              @Param("lat") double lat, @Param("lng") double lng);
}
