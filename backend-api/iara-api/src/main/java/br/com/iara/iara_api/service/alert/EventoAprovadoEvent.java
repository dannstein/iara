package br.com.iara.iara_api.service.alert;

import java.util.UUID;

/**
 * Publicado quando um evento sai de SOLICITADO para ATIVO via aprovação do gestor.
 * Gatilho para regras automáticas que reagem a aprovação (notificar próximos,
 * convocar técnicos, avisar pontos de coleta).
 */
public record EventoAprovadoEvent(UUID eventoId, UUID tenantId, UUID aprovadorId) {
}
