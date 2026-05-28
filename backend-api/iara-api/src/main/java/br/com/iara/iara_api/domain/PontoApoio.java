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
@Table(name = "iara_ponto_apoio")
@Getter
@Setter
@NoArgsConstructor
public class PontoApoio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_ponto_atencao", nullable = false)
    private PontoAtencao pontoAtencao;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "text")
    private String descricao;

    @Column(name = "endereco_txt", length = 500)
    private String enderecoTxt;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point geometria;

    @Column(length = 100)
    private String contato;

    @Column(length = 150)
    private String responsavel;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
