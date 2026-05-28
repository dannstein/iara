package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_hospital")
@Getter
@Setter
@NoArgsConstructor
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(length = 7, unique = true)
    private String cnes;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point coordenadas;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_endereco")
    private Endereco endereco;

    @Column(length = 100)
    private String contato;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "leitos_total")
    private Integer leitosTotal;

    @Column(name = "leitos_disponiveis")
    private Integer leitosDisponiveis;

    @Column(name = "leitos_uti")
    private Integer leitosUti;

    @Column(name = "leitos_uti_disp")
    private Integer leitosUtiDisp;

    @Column(name = "aceita_campanha", nullable = false)
    private boolean aceitaCampanha = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
