package br.com.iara.iara_api.dto.zona;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Criação/edição de zona de risco. Modelo ponto+raio (como evento): envie
 * {@code coordenadas} + {@code raioMetros}. {@code geometria} (GeoJSON) é aceito
 * como alternativa/legado. {@code idsPontoApoio} vincula pontos de apoio livres na criação.
 */
public record ZonaRiscoRequest(
        @NotBlank String nome,
        String descricao,
        @NotBlank String tipo,
        @Valid CoordenadasDTO coordenadas,
        Integer raioMetros,
        Map<String, Object> geometria,
        @NotNull @Min(1) @Max(5) Short nivelRisco,
        String fonte,
        LocalDate dataMapeamento,
        List<UUID> idsPontoApoio
) {
}
