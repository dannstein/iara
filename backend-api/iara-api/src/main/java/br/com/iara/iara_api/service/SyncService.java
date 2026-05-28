package br.com.iara.iara_api.service;

import br.com.iara.iara_api.dto.sync.SyncBatchRequest;
import br.com.iara.iara_api.repository.*;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Sincronização offline (RNF05). pendentes lista registros do usuário com
 * data_sincronizacao nula (query 12). batch marca os IDs informados como
 * sincronizados (registros já persistidos pelo cliente com data nula).
 */
@Service
@RequiredArgsConstructor
public class SyncService {

    private final CheckinRepository checkinRepository;
    private final InformeCampoRepository informeRepository;
    private final VitimaTriagemRepository triagemRepository;
    private final MorgueRepository morgueRepository;
    private final DoacaoIntencaoRepository doacaoRepository;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public Map<String, List<UUID>> pendentes() {
        UUID uid = currentUser.id();
        return Map.of(
                "checkins", ids(checkinRepository.findByUsuarioIdAndDataSincronizacaoIsNull(uid),
                        c -> c.getId()),
                "informes", ids(informeRepository.findByUsuarioIdAndDataSincronizacaoIsNull(uid),
                        i -> i.getId()),
                "triagens", ids(triagemRepository.findByTriadorIdAndDataSincronizacaoIsNull(uid),
                        t -> t.getId()),
                "morgue", ids(morgueRepository.findByRegistradoPorIdAndDataSincronizacaoIsNull(uid),
                        m -> m.getId()),
                "intencoes", ids(doacaoRepository.findByUsuarioIdAndDataSincronizacaoIsNull(uid),
                        d -> d.getId())
        );
    }

    @Transactional
    public Map<String, Object> batch(SyncBatchRequest req) {
        OffsetDateTime now = OffsetDateTime.now();
        int ok = 0;
        ok += marcar(req.checkins(), id -> checkinRepository.findById(id)
                .ifPresent(c -> c.setDataSincronizacao(now)));
        ok += marcar(req.informes(), id -> informeRepository.findById(id)
                .ifPresent(i -> i.setDataSincronizacao(now)));
        ok += marcar(req.triagens(), id -> triagemRepository.findById(id)
                .ifPresent(t -> t.setDataSincronizacao(now)));
        ok += marcar(req.morgue(), id -> morgueRepository.findById(id)
                .ifPresent(m -> m.setDataSincronizacao(now)));
        ok += marcar(req.intencoes(), id -> doacaoRepository.findById(id)
                .ifPresent(d -> d.setDataSincronizacao(now)));
        return Map.of("sincronizados", ok, "data_sincronizacao", now.toString());
    }

    private <T> List<UUID> ids(List<T> list, Function<T, UUID> idFn) {
        return list.stream().map(idFn).toList();
    }

    private int marcar(List<UUID> ids, Consumer<UUID> marcador) {
        if (ids == null) {
            return 0;
        }
        ids.forEach(marcador);
        return ids.size();
    }
}
