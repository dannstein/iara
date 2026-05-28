package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Geometry;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "iara_zona_risco")
@Getter
@Setter
@NoArgsConstructor
public class ZonaRisco {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "text")
    private String descricao;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false, columnDefinition = "geometry(Geometry,4326)")
    private Geometry geometria;

    @Column(name = "nivel_risco", nullable = false)
    private short nivelRisco;

    @Column(name = "raio_metros")
    private Integer raioMetros;

    @OneToMany(mappedBy = "zonaRisco", fetch = FetchType.LAZY)
    private List<PontoApoioGeral> apoios = new ArrayList<>();

    @Column(length = 255)
    private String fonte;

    @Column(name = "data_mapeamento")
    private LocalDate dataMapeamento;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_cad")
    private Usuario cadastradoPor;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
