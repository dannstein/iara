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
@Table(name = "iara_recurso_dc")
@Getter
@Setter
@NoArgsConstructor
public class RecursoDc {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tipo", nullable = false)
    private RecursoTipo tipo;

    @Column(nullable = false, length = 100)
    private String identificacao;

    @Column(length = 255)
    private String descricao;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point localizacao;

    @Column(nullable = false, length = 20)
    private String status = "DISPONIVEL";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_resp")
    private Usuario responsavel;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
