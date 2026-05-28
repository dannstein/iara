package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_estacao_monitoramento")
@Getter
@Setter
@NoArgsConstructor
public class EstacaoMonitoramento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false, length = 20)
    private String fonte;

    @Column(name = "codigo_externo", length = 50)
    private String codigoExterno;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point coordenadas;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
