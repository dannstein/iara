package br.com.iara.iara_api.dto.alerta;

import java.util.List;

public record AlertaTemplateDTO(
        String categoria,
        String titulo,
        String mensagem,
        List<String> placeholders
) {
}
