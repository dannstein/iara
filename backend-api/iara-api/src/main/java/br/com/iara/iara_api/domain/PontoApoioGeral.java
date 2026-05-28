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

/**
 * Ponto de apoio standalone (infraestrutura). Atende, no máximo, uma zona de risco
 * (FK opcional {@code zonaRisco}). Quando a zona é desativada, o vínculo é liberado.
 */
@Entity
@Table(name = "iara_ponto_apoio_geral")
@Getter
@Setter
@NoArgsConstructor
public class PontoApoioGeral {

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

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point geometria;

    @Column(length = 100)
    private String contato;

    @Column(length = 150)
    private String responsavel;

    @Column(name = "endereco_txt", length = 500)
    private String enderecoTxt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona_risco")
    private ZonaRisco zonaRisco;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
