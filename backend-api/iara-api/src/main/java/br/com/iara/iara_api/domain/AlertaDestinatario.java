package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_alerta_destinatario",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_alerta", "id_usuario"}))
@Getter
@Setter
@NoArgsConstructor
public class AlertaDestinatario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_alerta", nullable = false)
    private Alerta alerta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "delivery_status", nullable = false, length = 20)
    private String deliveryStatus = "SENT";

    @Column(length = 20)
    private String response;

    @Column(name = "sent_at", nullable = false)
    private OffsetDateTime sentAt = OffsetDateTime.now();

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Column(name = "visualized_at")
    private OffsetDateTime visualizedAt;

    @Column(name = "acknowledged_at")
    private OffsetDateTime acknowledgedAt;

    @Column(name = "responded_at")
    private OffsetDateTime respondedAt;

    @Column(name = "failure_reason", columnDefinition = "text")
    private String failureReason;
}
