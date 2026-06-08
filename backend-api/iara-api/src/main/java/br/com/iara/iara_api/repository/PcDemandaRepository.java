package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.PcDemanda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PcDemandaRepository extends JpaRepository<PcDemanda, UUID> {

    @Query("""
            select d from PcDemanda d
            where d.pc.id = :pcId
              and (:isActive is null or d.isActive = :isActive)
              and (:prioridade is null or d.prioridade = :prioridade)
              and (:eventoId is null or d.evento.id = :eventoId)
            order by d.createdAt desc
            """)
    List<PcDemanda> listarPorPc(@Param("pcId") UUID pcId,
                                @Param("isActive") Boolean isActive,
                                @Param("prioridade") String prioridade,
                                @Param("eventoId") UUID eventoId);

    /**
     * Mural de necessidades (query 5 do DDL, RF09): demandas ativas não totalmente
     * atendidas do evento, ordenadas por prioridade.
     */
    @Query(value = """
            select * from iara_pc_demanda d
            where d.id_evento = :eventoId
              and d.is_active = true
              and d.qtd_atendida < d.qtd_solicitada
            order by case d.prioridade
                        when 'CRITICA' then 1 when 'ALTA' then 2
                        when 'MEDIA' then 3 when 'BAIXA' then 4 else 5 end,
                     d.created_at
            """, nativeQuery = true)
    List<PcDemanda> mural(@Param("eventoId") UUID eventoId);

    /** Sub-fase 4D — usado no listener de EventoEncerradoEvent. */
    @Query("select d from PcDemanda d where d.evento.id = :eventoId")
    List<PcDemanda> listarPorEvento(@Param("eventoId") UUID eventoId);
}
