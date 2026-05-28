package br.com.iara.iara_api.dto.lookup;

import java.util.UUID;

public record DesastreTipoDTO(UUID id, String cobradeCod, String nome, String descricao) {
}
