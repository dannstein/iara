package br.com.iara.iara_api.dto.abrigo;

import br.com.iara.iara_api.domain.AbrigoOcupante;

import java.time.OffsetDateTime;
import java.util.UUID;

public record OcupanteDTO(
        UUID id,
        UUID abrigoId,
        String nome,
        String documento,
        Short idade,
        boolean isIdoso,
        boolean isCrianca,
        boolean isPcd,
        boolean isGestante,
        Boolean isPrioridade,
        String necessidadeEspecialTipo,
        OffsetDateTime dataEntrada,
        OffsetDateTime dataSaida
) {
    public static OcupanteDTO from(AbrigoOcupante o) {
        return new OcupanteDTO(
                o.getId(),
                o.getAbrigo().getId(),
                o.getNome(),
                o.getDocumento(),
                o.getIdade(),
                o.isIdoso(),
                o.isCrianca(),
                o.isPcd(),
                o.isGestante(),
                o.getIsPrioridade(),
                o.getNecessidadeEspecialTipo(),
                o.getDataEntrada(),
                o.getDataSaida()
        );
    }
}
