package br.com.iara.iara_api.service.automatico;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Catálogo de todas as regras de alerta automático conhecidas pela aplicação.
 * Mantém dois índices: por id() e por classe de evento gatilho.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AlertaAutomaticoRegistry {

    private final List<IAlertaAutomaticoRule> rules;

    private final Map<String, IAlertaAutomaticoRule> byId = new HashMap<>();
    private final Map<Class<?>, List<IAlertaAutomaticoRule>> byTrigger = new HashMap<>();

    @PostConstruct
    void index() {
        for (IAlertaAutomaticoRule r : rules) {
            if (byId.containsKey(r.id())) {
                throw new IllegalStateException("Regra automática duplicada: " + r.id());
            }
            byId.put(r.id(), r);
            byTrigger.computeIfAbsent(r.triggerEventClass(), k -> new ArrayList<>()).add(r);
        }
        log.info("[AlertaAutomaticoRegistry] {} regras registradas: {}", rules.size(), byId.keySet());
    }

    public List<IAlertaAutomaticoRule> all() {
        return Collections.unmodifiableList(rules);
    }

    public IAlertaAutomaticoRule byId(String id) {
        return byId.get(id);
    }

    public List<IAlertaAutomaticoRule> byTriggerClass(Class<?> eventClass) {
        return byTrigger.getOrDefault(eventClass, List.of());
    }
}
