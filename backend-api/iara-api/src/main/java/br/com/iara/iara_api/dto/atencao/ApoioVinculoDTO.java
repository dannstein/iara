package br.com.iara.iara_api.dto.atencao;

import br.com.iara.iara_api.domain.AtencaoApoio;

import java.util.UUID;

public record ApoioVinculoDTO(
        UUID id,
        UUID pontoAtencaoId,
        UUID idPc,
        UUID idAbrigo,
        UUID idPontoApoio,
        String observacao
) {
    public static ApoioVinculoDTO from(AtencaoApoio a) {
        return new ApoioVinculoDTO(
                a.getId(),
                a.getPontoAtencao().getId(),
                a.getPc() != null ? a.getPc().getId() : null,
                a.getAbrigo() != null ? a.getAbrigo().getId() : null,
                a.getPontoApoio() != null ? a.getPontoApoio().getId() : null,
                a.getObservacao()
        );
    }
}
