package br.com.iara.iara_api.dto.lookup;

import java.util.UUID;

public record LookupItemDTO(UUID id, String nome, String descricao) {
}
