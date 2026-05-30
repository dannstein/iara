package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.exception.NotFoundException;

import java.util.List;
import java.util.Map;

/**
 * Biblioteca estática de templates de mensagem por categoria de alerta.
 * Os placeholders são substituídos no frontend ao escolher zona/evento/tenant
 * (servidor não tem acesso ao contexto da UI; expõe só os templates brutos).
 *
 * <p>Placeholders suportados:
 *   {zonaNome}, {zonaTipo}, {nivelRisco},
 *   {eventoTitulo}, {severidade}, {raioKm},
 *   {tenantNome}.
 */
public final class AlertaTemplates {

    public record Template(String titulo, String mensagem, List<String> placeholders) {}

    private static final Map<String, Template> BY_CATEGORIA = Map.of(
            "DANGER_ZONE", new Template(
                    "Risco em {zonaNome}",
                    "Risco identificado em {zonaNome} ({zonaTipo}, nível {nivelRisco}). Tome precauções e mantenha-se informado.",
                    List.of("zonaNome", "zonaTipo", "nivelRisco")
            ),
            "EVENT_ZONE", new Template(
                    "Alerta: {eventoTitulo}",
                    "Há um evento ativo na sua área ({severidade}): {eventoTitulo}. Siga orientações da Defesa Civil.",
                    List.of("eventoTitulo", "severidade")
            ),
            "TENANT_BROADCAST", new Template(
                    "Aviso da Defesa Civil — {tenantNome}",
                    "",
                    List.of("tenantNome")
            ),
            "TECHNICAL_REQUEST", new Template(
                    "Solicitação de técnicos: {eventoTitulo}",
                    "Sua presença foi requisitada no evento {eventoTitulo}. Confirme disponibilidade pelo app.",
                    List.of("eventoTitulo")
            ),
            "SUPPORT_POINTS", new Template(
                    "Aviso a pontos de apoio: {zonaNome}",
                    "Risco iminente próximo à zona {zonaNome}. Prepare-se para receber pessoas em deslocamento.",
                    List.of("zonaNome")
            ),
            "COLLECTION_POINTS", new Template(
                    "Aviso a pontos de coleta: {eventoTitulo}",
                    "Atualização sobre o evento {eventoTitulo}. Verifique o painel de demandas.",
                    List.of("eventoTitulo")
            ),
            "MONITORS", new Template(
                    "Comunicado aos monitores",
                    "Atualização operacional sobre o cenário em curso.",
                    List.of()
            ),
            "PERSONALIZED", new Template(
                    "",
                    "",
                    List.of()
            ),
            "ESCALATION", new Template(
                    "Escalonamento: {eventoTitulo}",
                    "Esta situação requer ação imediata da camada superior da hierarquia. Detalhes no detalhe do alerta.",
                    List.of("eventoTitulo")
            )
    );

    private AlertaTemplates() {}

    public static Template forCategoria(String categoria) {
        Template t = BY_CATEGORIA.get(categoria);
        if (t == null) {
            throw new NotFoundException("Categoria de template não encontrada: " + categoria);
        }
        return t;
    }
}
