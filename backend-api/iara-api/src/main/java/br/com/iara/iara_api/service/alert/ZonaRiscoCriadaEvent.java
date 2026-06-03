package br.com.iara.iara_api.service.alert;

import java.util.UUID;

/**
 * Publicado quando uma nova zona de risco é cadastrada por um gestor.
 * Gatilho para regras automáticas que notificam usuários próximos.
 */
public record ZonaRiscoCriadaEvent(UUID zonaId, UUID tenantId, UUID criadoPorId) {
}
