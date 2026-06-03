package br.com.iara.iara_api.service.alert;

import java.util.UUID;

/**
 * Publicado em toda transição de status de um Evento (exceto SOLICITADO→ATIVO,
 * que tem o evento dedicado {@link EventoAprovadoEvent}). Usado por regras
 * automáticas que reagem a escalonamentos (ex: ATIVO → ALERTA_CRITICO).
 */
public record EventoStatusChangedEvent(UUID eventoId, UUID tenantId, String statusAnterior, String statusNovo) {
}
