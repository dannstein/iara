package br.com.iara.iara_api.service.alert;

import br.com.iara.iara_api.domain.AlertaAgendado;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.alerta.AlertaAgendadoDTO;
import br.com.iara.iara_api.dto.alerta.CreateAlertaAgendadoRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.AlertaAgendadoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertaAgendamentoService {

    private static final Set<String> VALID_CATEGORIAS = Set.of(
            "DANGER_ZONE", "EVENT_ZONE", "TENANT_BROADCAST", "TECHNICAL_REQUEST",
            "SUPPORT_POINTS", "COLLECTION_POINTS", "MONITORS", "PERSONALIZED"
    );
    private static final Set<String> VALID_RECORRENCIAS = Set.of(
            "ONE_TIME", "HOURLY", "DAILY", "WEEKLY", "MONTHLY"
    );

    private final AlertaAgendadoRepository repository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public AlertaAgendadoDTO criar(CreateAlertaAgendadoRequest req) {
        Usuario u = currentUser.require();
        validateCategoria(req.categoria());
        validateRecorrencia(req.tipoRecorrencia());

        AlertaAgendado a = new AlertaAgendado();
        a.setTenant(u.getTenant());
        a.setCriador(u);
        a.setNome(req.nome());
        a.setCategoria(req.categoria());
        a.setPayload(req.payload());
        a.setTipoRecorrencia(req.tipoRecorrencia());
        a.setInicio(req.inicio());
        a.setFim(req.fim());
        a.setHorario(req.horario());
        a.setDiaSemana(req.diaSemana());
        a.setDiaMes(req.diaMes());
        a.setIntervaloHoras(req.intervaloHoras());
        a.setAtivo(true);

        OffsetDateTime first = RecurrenceCalculator.computeFirstExecution(a);
        if (first == null) {
            throw new BusinessException("Recorrência resulta em execução nula — ajuste inicio/fim");
        }
        a.setProximaExecucao(first);
        return AlertaAgendadoDTO.from(repository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AlertaAgendadoDTO> listar(Boolean ativo, String categoria) {
        Usuario u = currentUser.require();
        return repository.filtrar(tenantScope.visibleTenantIds(u), ativo, categoria)
                .stream().map(AlertaAgendadoDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public AlertaAgendadoDTO detalhar(UUID id) {
        return AlertaAgendadoDTO.from(buscarVisivel(id));
    }

    @Transactional
    public AlertaAgendadoDTO ativar(UUID id) {
        AlertaAgendado a = buscarVisivel(id);
        if (!a.isAtivo()) {
            a.setAtivo(true);
            // Recalcula próxima execução se já passou
            if (a.getProximaExecucao().isBefore(OffsetDateTime.now())) {
                OffsetDateTime next = RecurrenceCalculator.computeNextExecution(a, OffsetDateTime.now());
                if (next == null) {
                    a.setAtivo(false);
                    throw new BusinessException("Agendamento ONE_TIME expirado não pode ser reativado");
                }
                a.setProximaExecucao(next);
            }
        }
        return AlertaAgendadoDTO.from(a);
    }

    @Transactional
    public AlertaAgendadoDTO desativar(UUID id) {
        AlertaAgendado a = buscarVisivel(id);
        a.setAtivo(false);
        return AlertaAgendadoDTO.from(a);
    }

    @Transactional
    public AlertaAgendadoDTO atualizar(UUID id, CreateAlertaAgendadoRequest req) {
        AlertaAgendado a = buscarVisivel(id);
        validateCategoria(req.categoria());
        validateRecorrencia(req.tipoRecorrencia());
        a.setNome(req.nome());
        a.setCategoria(req.categoria());
        a.setPayload(req.payload());
        a.setTipoRecorrencia(req.tipoRecorrencia());
        a.setInicio(req.inicio());
        a.setFim(req.fim());
        a.setHorario(req.horario());
        a.setDiaSemana(req.diaSemana());
        a.setDiaMes(req.diaMes());
        a.setIntervaloHoras(req.intervaloHoras());
        OffsetDateTime next = RecurrenceCalculator.computeFirstExecution(a);
        if (next == null) {
            throw new BusinessException("Recorrência resulta em execução nula — ajuste inicio/fim");
        }
        a.setProximaExecucao(next);
        return AlertaAgendadoDTO.from(a);
    }

    @Transactional
    public void remover(UUID id) {
        AlertaAgendado a = buscarVisivel(id);
        repository.delete(a);
    }

    private AlertaAgendado buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        AlertaAgendado a = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Agendamento não encontrado"));
        if (!tenantScope.canSee(u, a.getTenant().getId())) {
            throw new ForbiddenException("Agendamento fora do seu escopo de tenant");
        }
        return a;
    }

    private static void validateCategoria(String c) {
        if (!VALID_CATEGORIAS.contains(c)) {
            throw new BusinessException("Categoria inválida para agendamento: " + c);
        }
    }

    private static void validateRecorrencia(String r) {
        if (!VALID_RECORRENCIAS.contains(r)) {
            throw new BusinessException("Tipo de recorrência inválido: " + r);
        }
    }
}
