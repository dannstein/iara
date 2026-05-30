package br.com.iara.iara_api.service.alert;

import java.util.UUID;

/**
 * Spring application event publicado quando um Evento é encerrado ou cancelado.
 * Usado para resolver automaticamente alertas linkados a ele.
 */
public record EventoEncerradoEvent(UUID eventoId, String motivo) {
}
