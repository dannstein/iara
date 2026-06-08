package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.domain.PcMotivoRecusa;

import java.util.UUID;

public record MotivoRecusaDTO(
        UUID id,
        String codigo,
        String label,
        boolean exigeDescricao
) {
    public static MotivoRecusaDTO from(PcMotivoRecusa m) {
        return new MotivoRecusaDTO(m.getId(), m.getCodigo(), m.getLabel(), m.isExigeDescricao());
    }
}
