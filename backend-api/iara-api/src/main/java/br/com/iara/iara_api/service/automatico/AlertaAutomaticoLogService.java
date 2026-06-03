package br.com.iara.iara_api.service.automatico;

import br.com.iara.iara_api.domain.AlertaAutomaticoLog;
import br.com.iara.iara_api.domain.Tenant;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.repository.AlertaAutomaticoLogRepository;
import br.com.iara.iara_api.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertaAutomaticoLogService {

    private final AlertaAutomaticoLogRepository repo;
    private final TenantRepository tenantRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAtivado(UUID tenantId, String ruleId, Usuario u, Map<String, Object> config) {
        write(tenantId, ruleId, "ATIVADO", u, null, config);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDesativado(UUID tenantId, String ruleId, Usuario u) {
        write(tenantId, ruleId, "DESATIVADO", u, null, null);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logConfigAlterado(UUID tenantId, String ruleId, Usuario u, Map<String, Object> config) {
        write(tenantId, ruleId, "CONFIG_ALTERADO", u, null, config);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDisparo(UUID tenantId, String ruleId, UUID alertaId, Object event) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("event_class", event.getClass().getSimpleName());
        write(tenantId, ruleId, "DISPAROU", null, alertaId, payload);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logErro(UUID tenantId, String ruleId, String msg) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("error", msg);
        write(tenantId, ruleId, "ERRO", null, null, payload);
    }

    private void write(UUID tenantId, String ruleId, String acao,
                       Usuario u, UUID alertaId, Map<String, Object> payload) {
        Tenant t = tenantRepository.findById(tenantId).orElse(null);
        if (t == null) return;
        AlertaAutomaticoLog l = new AlertaAutomaticoLog();
        l.setTenant(t);
        l.setRuleId(ruleId);
        l.setAcao(acao);
        l.setUsuario(u);
        l.setAlertaId(alertaId);
        l.setPayload(payload);
        repo.save(l);
    }
}
