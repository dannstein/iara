package br.com.iara.iara_api.dto.pc;

import java.util.UUID;

public record ConfirmarDoacaoRequest(
        UUID idUsuConfirmou
) {
}
