package br.com.iara.iara_api.dto.alerta;

import java.util.Map;
import java.util.UUID;

public record AlertaPreviewDTO(
        int totalDestinatarios,
        Map<String, Integer> porRole,
        Map<UUID, Integer> porTenant,
        boolean cooldownAtivo,
        UUID existingAlertaId
) {
}
