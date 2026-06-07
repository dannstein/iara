package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Linha de histórico imutável do PC (sub-fase 4F). RULES no banco bloqueiam
 * UPDATE e DELETE — somente INSERT é permitido. Servida pela aba "Histórico"
 * do coordenador e pela atividade per-worker.
 */
@Entity
@Table(name = "iara_pc_audit_log")
@Getter
@Setter
@NoArgsConstructor
public class PcAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "id_pc", nullable = false)
    private UUID pcId;

    @Column(name = "id_evento")
    private UUID eventoId;

    @Column(name = "id_ator", nullable = false)
    private UUID atorId;

    @Column(nullable = false, length = 50)
    private String acao;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
