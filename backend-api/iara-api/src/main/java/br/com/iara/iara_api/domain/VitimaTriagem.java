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
@Table(name = "iara_vitima_triagem")
@Getter
@Setter
@NoArgsConstructor
public class VitimaTriagem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @Column(name = "codigo_campo", nullable = false, length = 20)
    private String codigoCampo;

    @Column(name = "nome_provisorio", length = 150)
    private String nomeProvisorio;

    @Column(name = "idade_estimada")
    private Short idadeEstimada;

    @Column(nullable = false, length = 10)
    private String classificacao;

    @Column(name = "respira_apos_abertura")
    private Boolean respiraAposAbertura;

    @Column(name = "local_encontrado", columnDefinition = "geometry(Point,4326)")
    private Point localEncontrado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_setor")
    private SetorOperacao setor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_triador", nullable = false)
    private Usuario triador;

    @Column(columnDefinition = "text")
    private String observacoes;

    @Column(name = "data_sincronizacao")
    private OffsetDateTime dataSincronizacao;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
