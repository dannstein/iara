package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Alerta;
import br.com.iara.iara_api.domain.AlertaTipo;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.evento.AlertaDTO;
import br.com.iara.iara_api.dto.evento.CreateAlertaRequest;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.repository.AlertaRepository;
import br.com.iara.iara_api.repository.AlertaTipoRepository;
import br.com.iara.iara_api.repository.EventoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlertaService {

    private final AlertaRepository alertaRepository;
    private final AlertaTipoRepository alertaTipoRepository;
    private final EventoRepository eventoRepository;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public AlertaDTO emitir(CreateAlertaRequest req) {
        Usuario u = currentUser.require();
        AlertaTipo tipo = alertaTipoRepository.findById(req.idTipo())
                .orElseThrow(() -> new NotFoundException("Tipo de alerta não encontrado"));
        Alerta a = new Alerta();
        a.setTenant(u.getTenant());
        a.setTipo(tipo);
        a.setEmissor(u);
        a.setMensagem(req.mensagem());
        if (req.idEvento() != null) {
            a.setEvento(eventoRepository.findById(req.idEvento())
                    .orElseThrow(() -> new NotFoundException("Evento não encontrado")));
        }
        if (req.areaAlerta() != null) {
            a.setAreaAlerta(GeoUtil.fromGeoJson(req.areaAlerta()));
        }
        return AlertaDTO.from(alertaRepository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AlertaDTO> listar() {
        Usuario u = currentUser.require();
        return alertaRepository.findByTenantIdInOrderByCreatedAtDesc(tenantScope.visibleTenantIds(u))
                .stream().map(AlertaDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AlertaDTO> geofencing(double lat, double lng) {
        Usuario u = currentUser.require();
        return alertaRepository.geofencing(lat, lng, tenantScope.visibleTenantIds(u))
                .stream().map(AlertaDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public AlertaDTO detalhar(UUID id) {
        return AlertaDTO.from(buscarVisivel(id));
    }

    @Transactional
    public void encerrar(UUID id) {
        alertaRepository.delete(buscarVisivel(id));
    }

    private Alerta buscarVisivel(UUID id) {
        Usuario u = currentUser.require();
        Alerta a = alertaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Alerta não encontrado"));
        if (!tenantScope.canSee(u, a.getTenant().getId())) {
            throw new ForbiddenException("Alerta fora do seu escopo de tenant");
        }
        return a;
    }
}
