package br.com.iara.iara_api.dto.usuario;

import java.util.List;

public record UpdateNotificacaoPrefRequest(
        List<String> categoriasSilenciadas,
        List<String> severidadesSilenciadas,
        Boolean naoPerturbe
) {
}
