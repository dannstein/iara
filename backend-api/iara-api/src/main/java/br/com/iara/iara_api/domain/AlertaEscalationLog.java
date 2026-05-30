package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_alerta_escalation_log")
@Getter
@Setter
@NoArgsConstructor
public class AlertaEscalationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_alerta", nullable = false)
    private Alerta alerta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_escalou", nullable = false)
    private Usuario escalador;

    @Column(name = "from_tenant", nullable = false)
    private UUID fromTenant;

    @Column(name = "to_tenant", nullable = false)
    private UUID toTenant;

    @Column(nullable = false, columnDefinition = "text")
    private String motivo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
