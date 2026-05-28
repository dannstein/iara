package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.Helper;

import java.util.UUID;

public record HelperDTO(
        UUID id,
        UUID usuarioId,
        UUID pcId,
        String iniciadoPor,
        String status,
        boolean isActive
) {
    public static HelperDTO from(Helper h) {
        return new HelperDTO(
                h.getId(),
                h.getUsuario().getId(),
                h.getPc().getId(),
                h.getIniciadoPor(),
                h.getStatus(),
                h.isActive()
        );
    }
}
