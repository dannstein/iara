package br.com.iara.iara_api.dto.alerta;

public record AckSummaryDTO(
        int sent,
        int delivered,
        int visualized,
        int acknowledged,
        int accepted,
        int refused,
        int unavailable,
        int failed
) {
}
