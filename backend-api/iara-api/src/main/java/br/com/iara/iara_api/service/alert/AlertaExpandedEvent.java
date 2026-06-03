package br.com.iara.iara_api.service.alert;

import java.util.UUID;

/**
 * Publicado quando o {@link AlertaRadiusExpansionJob} expande o raio de um TECHNICAL_REQUEST.
 * Listeners podem auditar / instrumentar / criar timeline entry.
 */
public record AlertaExpandedEvent(
        UUID alertaId,
        int fromRadius,
        int toRadius,
        int newRecipients,
        int currentStep
) {
}
