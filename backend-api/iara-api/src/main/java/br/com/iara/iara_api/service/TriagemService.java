package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.VitimaTriagem;
import br.com.iara.iara_api.dto.evento.TriagemDTO;
import br.com.iara.iara_api.dto.evento.TriagemRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.repository.SetorOperacaoRepository;
import br.com.iara.iara_api.repository.VitimaTriagemRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TriagemService {

    private static final Set<String> CLASSIFICACOES = Set.of("VERMELHO", "AMARELO", "VERDE", "PRETO");

    private final VitimaTriagemRepository triagemRepository;
    private final SetorOperacaoRepository setorRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    @Transactional
    public TriagemDTO registrar(UUID eventoId, TriagemRequest req) {
        if (!CLASSIFICACOES.contains(req.classificacao())) {
            throw new BusinessException("Classificação inválida");
        }
        // RN14: quem não respira após abertura de vias deve ser PRETO
        if (Boolean.FALSE.equals(req.respiraAposAbertura()) && !"PRETO".equals(req.classificacao())) {
            throw new BusinessException(
                    "RN14: paciente que não respira deve ser classificado como PRETO");
        }
        Evento e = eventoService.buscarVisivel(eventoId);

        VitimaTriagem t = new VitimaTriagem();
        t.setEvento(e);
        t.setCodigoCampo(req.codigoCampo());
        t.setNomeProvisorio(req.nomeProvisorio());
        t.setIdadeEstimada(req.idadeEstimada());
        t.setClassificacao(req.classificacao());
        t.setRespiraAposAbertura(req.respiraAposAbertura());
        t.setTriador(currentUser.require());
        if (req.coordenadas() != null) {
            t.setLocalEncontrado(GeoUtil.point(req.coordenadas()));
        }
        if (req.idSetor() != null) {
            setorRepository.findById(req.idSetor()).ifPresent(t::setSetor);
        }
        t.setDataSincronizacao(req.dataSincronizacao());
        return TriagemDTO.from(triagemRepository.save(t));
    }

    /** Estado atual de cada vítima — registro mais recente por código (query 10). */
    @Transactional(readOnly = true)
    public List<TriagemDTO> estadoAtual(UUID eventoId) {
        eventoService.buscarVisivel(eventoId);
        return triagemRepository.estadoAtualPorEvento(eventoId).stream().map(TriagemDTO::from).toList();
    }

    /** Histórico de reavaliações de uma vítima (RN13). */
    @Transactional(readOnly = true)
    public List<TriagemDTO> historicoVitima(UUID eventoId, String codigoCampo) {
        eventoService.buscarVisivel(eventoId);
        return triagemRepository.findByEventoIdAndCodigoCampoOrderByCreatedAtDesc(eventoId, codigoCampo)
                .stream().map(TriagemDTO::from).toList();
    }
}
