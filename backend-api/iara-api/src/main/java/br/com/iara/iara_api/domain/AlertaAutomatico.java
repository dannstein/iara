package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "iara_alerta_automatico",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_tenant", "rule_id"}))
@Getter
@Setter
@NoArgsConstructor
public class AlertaAutomatico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @Column(name = "rule_id", nullable = false, length = 80)
    private String ruleId;

    @Column(name = "is_ativo", nullable = false)
    private boolean ativo = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "config", columnDefinition = "jsonb")
    private Map<String, Object> config;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activated_by")
    private Usuario activatedBy;

    @Column(name = "activated_at")
    private OffsetDateTime activatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deactivated_by")
    private Usuario deactivatedBy;

    @Column(name = "deactivated_at")
    private OffsetDateTime deactivatedAt;
}
