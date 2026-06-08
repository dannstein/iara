package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.PcAuditLog;
import br.com.iara.iara_api.repository.PcAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Sub-fase 4F — append-only audit log do PC.
 *
 * <p>Chamado por dentro da transação do domínio (mesma tx). RULES no banco
 * garantem que UPDATE/DELETE não funcionem mesmo se alguém tentar via SQL
 * direto. Falhas no log NÃO devem reverter a operação de domínio — em casos
 * de erro, o método é silencioso.</p>
 */
@Service
@RequiredArgsConstructor
public class PcAuditService {

    private final PcAuditLogRepository repository;

    public static final String PC_AVAILABILITY_ACCEPTED  = "PC_AVAILABILITY_ACCEPTED";
    public static final String PC_AVAILABILITY_REFUSED   = "PC_AVAILABILITY_REFUSED";
    public static final String WORKER_AVAILABILITY_REQ   = "WORKER_AVAILABILITY_REQUESTED";
    public static final String WORKER_CONFIRMED          = "WORKER_CONFIRMED";
    public static final String WORKER_REFUSED            = "WORKER_REFUSED";
    public static final String DEMAND_CREATED            = "DEMAND_CREATED";
    public static final String DEMAND_CLOSED             = "DEMAND_CLOSED";
    public static final String DONATION_INTENT_CREATED   = "DONATION_INTENT_CREATED";
    public static final String DONATION_INTENT_CANCELLED = "DONATION_INTENT_CANCELLED";
    public static final String DONATION_RECEIVED         = "DONATION_RECEIVED";
    public static final String STOCK_DISTRIBUTED         = "STOCK_DISTRIBUTED";
    public static final String STOCK_ADJUSTED            = "STOCK_ADJUSTED";
    public static final String EVENT_INVENTORY_RESET     = "EVENT_INVENTORY_RESET";

    @Transactional(propagation = Propagation.MANDATORY)
    public void log(UUID pcId, UUID eventoId, UUID atorId, String acao, Map<String, Object> payload) {
        if (pcId == null || atorId == null || acao == null) return;
        PcAuditLog l = new PcAuditLog();
        l.setPcId(pcId);
        l.setEventoId(eventoId);
        l.setAtorId(atorId);
        l.setAcao(acao);
        l.setPayload(payload);
        repository.save(l);
    }
}
