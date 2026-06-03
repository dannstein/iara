package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_alerta")
@Getter
@Setter
@NoArgsConstructor
public class Alerta {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_evento")
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona_risco")
    private ZonaRisco zonaRisco;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tipo", nullable = false)
    private AlertaTipo tipo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_emitiu", nullable = false)
    private Usuario emissor;

    @Column(length = 200)
    private String titulo;

    @Column(nullable = false, columnDefinition = "text")
    private String mensagem;

    @Column(nullable = false, length = 20)
    private String severidade = "INFO";

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(nullable = false, length = 30)
    private String categoria = "PERSONALIZED";

    @Column(name = "target_role", length = 20)
    private String targetRole;

    @Column(name = "area_alerta", columnDefinition = "geometry(Geometry,4326)")
    private Geometry areaAlerta;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point coordenadas;

    @Column(name = "raio_metros")
    private Integer raioMetros;

    @Column(name = "geofence_modes", length = 200)
    private String geofenceModes;

    @Column(name = "data_expiracao")
    private OffsetDateTime dataExpiracao;

    @Column(name = "auto_expire_minutes")
    private Integer autoExpireMinutes;

    @Column(name = "data_resolvido")
    private OffsetDateTime dataResolvido;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_resolveu")
    private Usuario resolvedoPor;

    @Column(name = "requer_ack", nullable = false)
    private boolean requerAck = false;

    @Column(name = "ack_minimo")
    private Integer ackMinimo;

    @Column(name = "is_escalation", nullable = false)
    private boolean isEscalation = false;

    @Column(name = "escalation_motivo", columnDefinition = "text")
    private String escalationMotivo;

    @Column(name = "escalation_from_tenant")
    private UUID escalationFromTenant;

    @Column(name = "total_destinatarios", nullable = false)
    private int totalDestinatarios = 0;

    @Column(name = "merged_count", nullable = false)
    private int mergedCount = 0;

    /** CSV de raios em metros: "5000,10000,20000". Null = sem expansão automática. */
    @Column(name = "expansion_radii_metros", columnDefinition = "text")
    private String expansionRadiiMetros;

    @Column(name = "expansion_window_minutes")
    private Integer expansionWindowMinutes;

    @Column(name = "current_expansion_step", nullable = false)
    private int currentExpansionStep = 0;

    @Column(name = "last_expansion_at")
    private OffsetDateTime lastExpansionAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
