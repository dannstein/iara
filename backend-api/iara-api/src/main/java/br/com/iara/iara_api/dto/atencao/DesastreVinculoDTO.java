package br.com.iara.iara_api.dto.atencao;

import br.com.iara.iara_api.domain.AtencaoDesastre;

import java.util.UUID;

public record DesastreVinculoDTO(
        UUID id,
        UUID pontoAtencaoId,
        UUID desastreTipoId,
        String desastreNome,
        String observacao
) {
    public static DesastreVinculoDTO from(AtencaoDesastre a) {
        return new DesastreVinculoDTO(
                a.getId(),
                a.getPontoAtencao().getId(),
                a.getDesastreTipo().getId(),
                a.getDesastreTipo().getDesastreNome(),
                a.getObservacao()
        );
    }
}
