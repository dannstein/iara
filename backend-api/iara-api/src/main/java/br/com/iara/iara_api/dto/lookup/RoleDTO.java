package br.com.iara.iara_api.dto.lookup;

import java.util.UUID;

public record RoleDTO(UUID id, String nome, String descricao, String nivelMin) {
}
