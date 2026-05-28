package br.com.iara.iara_api.dto.abrigo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OcupanteRequest(
        @NotBlank @Size(max = 150) String nome,
        @Size(max = 14) String documento,
        Short idade,
        Boolean isIdoso,
        Boolean isCrianca,
        Boolean isPcd,
        Boolean isGestante,
        String necessidadeEspecialTipo
) {
    public boolean idoso() {
        return Boolean.TRUE.equals(isIdoso);
    }

    public boolean crianca() {
        return Boolean.TRUE.equals(isCrianca);
    }

    public boolean pcd() {
        return Boolean.TRUE.equals(isPcd);
    }

    public boolean gestante() {
        return Boolean.TRUE.equals(isGestante);
    }
}
