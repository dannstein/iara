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
@Table(name = "iara_pc")
@Getter
@Setter
@NoArgsConstructor
public class Pc {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_coordenador", nullable = false)
    private Usuario coordenador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_endereco")
    private Endereco endereco;

    @Column(name = "pc_tipo", nullable = false, length = 20)
    private String pcTipo = "FIXO";

    @Column(name = "pc_nome", nullable = false, length = 200)
    private String pcNome;

    @Column(name = "pc_coords", nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point pcCoords;

    @Column(name = "pc_desc", columnDefinition = "text")
    private String pcDesc;

    @Column(name = "pc_contato", length = 100)
    private String pcContato;

    @Column(name = "pc_is_verified", nullable = false)
    private boolean pcIsVerified = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_verificador")
    private Usuario verificador;

    @Column(name = "data_verificacao")
    private OffsetDateTime dataVerificacao;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
