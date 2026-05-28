package br.com.iara.iara_api.dto.sync;

import java.util.List;
import java.util.UUID;

/**
 * Lote de registros criados offline a sincronizar. Cada lista contém os IDs dos
 * registros (já persistidos com data_sincronizacao nula) a marcar como sincronizados.
 */
public record SyncBatchRequest(
        List<UUID> checkins,
        List<UUID> informes,
        List<UUID> triagens,
        List<UUID> morgue,
        List<UUID> intencoes
) {
}
