package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.usuario.LocationHistoryBatchRequest;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Persiste o histórico de localização de usuários (Fase 2C).
 * Insert é feito direto via {@link JdbcTemplate#batchUpdate} para evitar overhead
 * do JPA — volume potencialmente alto (1 ponto/min/usuário).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class LocationHistoryService {

    private final JdbcTemplate jdbcTemplate;
    private final CurrentUser currentUser;

    @Transactional
    public int registrarBatch(LocationHistoryBatchRequest req) {
        Usuario u = currentUser.require();
        if (req.pontos() == null || req.pontos().isEmpty()) return 0;

        // Validação de janela: nenhum ponto deve ser mais antigo que 24h.
        OffsetDateTime limite = OffsetDateTime.now().minus(Duration.ofHours(24));
        for (LocationHistoryBatchRequest.Point p : req.pontos()) {
            if (p.capturedAt().isBefore(limite)) {
                throw new BusinessException("Pontos mais antigos que 24h não são aceitos");
            }
        }

        UUID userId = u.getId();
        String sql = """
                insert into iara_usuario_localizacao_historico (id_usuario, coordenadas, captured_at)
                values (?, ST_SetSRID(ST_MakePoint(?, ?), 4326), ?)
                """;

        int[] counts = jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                LocationHistoryBatchRequest.Point p = req.pontos().get(i);
                ps.setObject(1, userId);
                ps.setDouble(2, p.lng());
                ps.setDouble(3, p.lat());
                ps.setTimestamp(4, Timestamp.from(p.capturedAt().toInstant()));
            }

            @Override
            public int getBatchSize() {
                return req.pontos().size();
            }
        });
        int total = 0;
        for (int c : counts) total += Math.max(c, 0);
        return total;
    }
}
