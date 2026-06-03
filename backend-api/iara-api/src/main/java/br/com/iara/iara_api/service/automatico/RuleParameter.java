package br.com.iara.iara_api.service.automatico;

/**
 * Descreve um parâmetro configurável de uma regra automática. Usado pelo
 * frontend para gerar dinamicamente o formulário de configuração.
 */
public record RuleParameter(
        String name,
        String type,            // "string" | "number" | "boolean" | "enum"
        String label,
        Object defaultValue,
        String[] options        // só para type=enum
) {
    public static RuleParameter number(String name, String label, Number defaultValue) {
        return new RuleParameter(name, "number", label, defaultValue, null);
    }

    public static RuleParameter string(String name, String label, String defaultValue) {
        return new RuleParameter(name, "string", label, defaultValue, null);
    }

    public static RuleParameter bool(String name, String label, boolean defaultValue) {
        return new RuleParameter(name, "boolean", label, defaultValue, null);
    }

    public static RuleParameter enumParam(String name, String label, String defaultValue, String... options) {
        return new RuleParameter(name, "enum", label, defaultValue, options);
    }
}
