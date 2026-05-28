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
@Table(name = "iara_ponto_atencao")
@Getter
@Setter
@NoArgsConstructor
public class PontoAtencao {

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

    @Column(name = "endereco_txt", nullable = false, length = 500)
    private String enderecoTxt;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point geometria;

    @Column(name = "is_industrial", nullable = false)
    private boolean isIndustrial = false;

    @Column(name = "substancia_perigosa_txt", columnDefinition = "text")
    private String substanciaPerigosaTxt;

    @Column(name = "classe_risco_industrial", length = 100)
    private String classeRiscoIndustrial;

    @Column(name = "nivel_risco", nullable = false)
    private short nivelRisco = 3;

    @Column(name = "populacao_estimada")
    private Integer populacaoEstimada;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "situacao_apoio", nullable = false, length = 20)
    private String situacaoApoio = "SEM_APOIO";

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
