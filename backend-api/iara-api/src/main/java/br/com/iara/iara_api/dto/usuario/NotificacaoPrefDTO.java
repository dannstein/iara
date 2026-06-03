package br.com.iara.iara_api.dto.usuario;

import br.com.iara.iara_api.domain.UsuarioNotificacaoPref;

import java.util.Arrays;
import java.util.List;

public record NotificacaoPrefDTO(
        List<String> categoriasSilenciadas,
        List<String> severidadesSilenciadas,
        boolean naoPerturbe
) {
    public static NotificacaoPrefDTO from(UsuarioNotificacaoPref p) {
        if (p == null) return new NotificacaoPrefDTO(List.of(), List.of(), false);
        return new NotificacaoPrefDTO(
                parseCsv(p.getCategoriasSilenciadas()),
                parseCsv(p.getSeveridadesSilenciadas()),
                p.isNaoPerturbe()
        );
    }

    private static List<String> parseCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }
}
