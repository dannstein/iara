package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Checkin;
import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.EventoEspecNecessaria;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.evento.CheckinDTO;
import br.com.iara.iara_api.dto.evento.CheckinRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.repository.CheckinRepository;
import br.com.iara.iara_api.repository.EventoEspecNecessariaRepository;
import br.com.iara.iara_api.repository.SetorOperacaoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CheckinService {

    private static final String CATEGORIA_SEGURANCA = "Segurança";

    private final CheckinRepository checkinRepository;
    private final SetorOperacaoRepository setorRepository;
    private final EventoEspecNecessariaRepository especNecessariaRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    @Transactional
    public CheckinDTO checkin(UUID eventoId, CheckinRequest req) {
        Evento e = eventoService.buscarVisivel(eventoId);
        Usuario u = currentUser.require();

        // RN19: zona QUENTE só permite técnico de Segurança
        double lat = req.coordenadas().lat();
        double lng = req.coordenadas().lng();
        boolean emZonaQuente = setorRepository.setorDaCoordenada(eventoId, lat, lng)
                .map(s -> "QUENTE".equals(s.getTipo()))
                .orElse(false);
        if (emZonaQuente && !isTecnicoSeguranca(u)) {
            throw new ForbiddenException(
                    "RN19: zona QUENTE restrita a técnicos com especialidade de Segurança");
        }

        Checkin c = new Checkin();
        c.setEvento(e);
        c.setUsuario(u);
        c.setCoordenadas(GeoUtil.point(req.coordenadas()));
        c.setDataSincronizacao(req.dataSincronizacao());
        checkinRepository.save(c);

        // RN19: incrementa qtd_alocada da especialidade do técnico, se declarada
        if (u.getEspec() != null) {
            especNecessariaRepository.findByEventoIdAndEspecId(eventoId, u.getEspec().getId())
                    .ifPresent(en -> en.setQtdAlocada(en.getQtdAlocada() + 1));
        }
        return CheckinDTO.from(c);
    }

    @Transactional
    public CheckinDTO checkout(UUID eventoId) {
        Usuario u = currentUser.require();
        Checkin c = checkinRepository
                .findFirstByEventoIdAndUsuarioIdAndDataCheckoutIsNullOrderByDataCheckinDesc(eventoId, u.getId())
                .orElseThrow(() -> new BusinessException("Nenhum check-in ativo encontrado"));
        c.setDataCheckout(java.time.OffsetDateTime.now());
        if (u.getEspec() != null) {
            especNecessariaRepository.findByEventoIdAndEspecId(eventoId, u.getEspec().getId())
                    .ifPresent(en -> en.setQtdAlocada(Math.max(0, en.getQtdAlocada() - 1)));
        }
        return CheckinDTO.from(c);
    }

    @Transactional(readOnly = true)
    public List<CheckinDTO> listarAtivos(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return checkinRepository.findByEventoIdAndDataCheckoutIsNull(eventoId).stream()
                .map(CheckinDTO::from).toList();
    }

    private boolean isTecnicoSeguranca(Usuario u) {
        return "TECNICO".equals(u.getRole().getRoleNome())
                && u.getEspec() != null
                && u.getEspec().getCategoria() != null
                && CATEGORIA_SEGURANCA.equals(u.getEspec().getCategoria().getCatNome());
    }
}
