package br.com.iara.iara_api.dto.alerta;

import java.util.Map;

public record AlertaDashboardDTO(
        long ativos,
        long criticosAtivos,
        long acksPendentes,
        long resolvidosHoje,
        Map<String, Long> porSeveridade,
        Map<String, Long> porCategoria
) {
}
