package br.com.iara.iara_api.dto.admin;

import java.util.List;

public record UpdateAppConfigRequest(
        Boolean disasterModeAtivo,
        List<String> canaisHabilitados
) {
}
