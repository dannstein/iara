package br.com.iara.iara_api.dto.alerta;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CreateTechnicalRequestAlertRequest(
        @NotNull UUID idEvento,
        UUID especialidadeId,
        Integer raioMetros,
        boolean tenantWide,
        String titulo,
        String mensagem,
        Integer ackMinimo,
        OffsetDateTime dataExpiracao,
        Integer autoExpireMinutes,
        /** Passos de expansão em metros. Se null, sem expansão. Ex: [5000, 10000, 20000]. */
        List<Integer> expansionRadiiMetros,
        /** Minutos a aguardar entre expansões. Default 5 quando expansion habilitada. */
        Integer expansionWindowMinutes
) {
}
