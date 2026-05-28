package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.AbrigoOcupante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AbrigoOcupanteRepository extends JpaRepository<AbrigoOcupante, UUID> {

    @Query("""
            select o from AbrigoOcupante o
            where o.abrigo.id = :abrigoId
              and (:isPrioridade is null or o.isPrioridade = :isPrioridade)
              and o.dataSaida is null
            order by o.dataEntrada desc
            """)
    List<AbrigoOcupante> listar(@Param("abrigoId") UUID abrigoId,
                                @Param("isPrioridade") Boolean isPrioridade);
}
