package br.com.iara.iara_api.service.automatico;

import br.com.iara.iara_api.domain.AlertaAutomatico;
import br.com.iara.iara_api.domain.Tenant;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.alerta.AlertaAutomaticoDTO;
import br.com.iara.iara_api.dto.alerta.AlertaAutomaticoLogDTO;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.AlertaAutomaticoLogRepository;
import br.com.iara.iara_api.repository.AlertaAutomaticoRepository;
import br.com.iara.iara_api.repository.TenantRepository;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertaAutomaticoService {

    private final AlertaAutomaticoRegistry registry;
    private final AlertaAutomaticoRepository repo;
    private final AlertaAutomaticoLogRepository logRepo;
    private final AlertaAutomaticoLogService logService;
    private final TenantRepository tenantRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<AlertaAutomaticoDTO> listar() {
        Usuario u = currentUser.require();
        UUID tenantId = u.getTenant().getId();
        List<AlertaAutomaticoDTO> result = new ArrayList<>();
        for (IAlertaAutomaticoRule rule : registry.all()) {
            AlertaAutomatico activation = repo.findByTenantIdAndRuleId(tenantId, rule.id()).orElse(null);
            result.add(AlertaAutomaticoDTO.from(rule, activation));
        }
        return result;
    }

    @Transactional
    public AlertaAutomaticoDTO ativar(String ruleId, Map<String, Object> config) {
        Usuario u = currentUser.require();
        UUID tenantId = u.getTenant().getId();
        IAlertaAutomaticoRule rule = exigirRegra(ruleId);
        AlertaAutomatico a = repo.findByTenantIdAndRuleId(tenantId, ruleId)
                .orElseGet(() -> novaAtivacao(tenantId, ruleId));
        a.setAtivo(true);
        a.setActivatedBy(u);
        a.setActivatedAt(OffsetDateTime.now());
        if (config != null) {
            a.setConfig(config);
        }
        repo.save(a);
        logService.logAtivado(tenantId, ruleId, u, a.getConfig());
        return AlertaAutomaticoDTO.from(rule, a);
    }

    @Transactional
    public AlertaAutomaticoDTO desativar(String ruleId) {
        Usuario u = currentUser.require();
        UUID tenantId = u.getTenant().getId();
        IAlertaAutomaticoRule rule = exigirRegra(ruleId);
        AlertaAutomatico a = repo.findByTenantIdAndRuleId(tenantId, ruleId)
                .orElseThrow(() -> new NotFoundException("Regra ainda não foi ativada nesse tenant"));
        a.setAtivo(false);
        a.setDeactivatedBy(u);
        a.setDeactivatedAt(OffsetDateTime.now());
        repo.save(a);
        logService.logDesativado(tenantId, ruleId, u);
        return AlertaAutomaticoDTO.from(rule, a);
    }

    @Transactional
    public AlertaAutomaticoDTO atualizarConfig(String ruleId, Map<String, Object> config) {
        Usuario u = currentUser.require();
        UUID tenantId = u.getTenant().getId();
        IAlertaAutomaticoRule rule = exigirRegra(ruleId);
        AlertaAutomatico a = repo.findByTenantIdAndRuleId(tenantId, ruleId)
                .orElseGet(() -> novaAtivacao(tenantId, ruleId));
        a.setConfig(config);
        repo.save(a);
        logService.logConfigAlterado(tenantId, ruleId, u, config);
        return AlertaAutomaticoDTO.from(rule, a);
    }

    @Transactional(readOnly = true)
    public Page<AlertaAutomaticoLogDTO> log(String ruleId, int page, int size) {
        Usuario u = currentUser.require();
        UUID tenantId = u.getTenant().getId();
        Page<?> pageData = logRepo.listar(tenantId, ruleId,
                PageRequest.of(page, Math.min(size, 200), Sort.by(Sort.Direction.DESC, "createdAt")));
        return pageData.map(entity -> AlertaAutomaticoLogDTO.from((br.com.iara.iara_api.domain.AlertaAutomaticoLog) entity));
    }

    private AlertaAutomatico novaAtivacao(UUID tenantId, String ruleId) {
        Tenant t = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new NotFoundException("Tenant inválido"));
        AlertaAutomatico a = new AlertaAutomatico();
        a.setTenant(t);
        a.setRuleId(ruleId);
        a.setAtivo(false);
        return a;
    }

    private IAlertaAutomaticoRule exigirRegra(String ruleId) {
        IAlertaAutomaticoRule rule = registry.byId(ruleId);
        if (rule == null) throw new NotFoundException("Regra automática não conhecida: " + ruleId);
        return rule;
    }
}
