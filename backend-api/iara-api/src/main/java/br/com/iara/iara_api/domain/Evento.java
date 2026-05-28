package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.Point;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_evento")
@Getter
@Setter
@NoArgsConstructor
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "text")
    private String descricao;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tipo", nullable = false)
    private DesastreTipo tipo;

    @Column(nullable = false, length = 20)
    private String status = "SOLICITADO";

    @Column(nullable = false, length = 10)
    private String severidade;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_solicitante", nullable = false)
    private Usuario solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_aprovador")
    private Usuario aprovador;

    @Column(nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point coordenadas;

    @Column(name = "raio_metros", nullable = false)
    private int raioMetros = 5000;

    @Column(name = "area_risco", columnDefinition = "geometry(Geometry,4326)")
    private Geometry areaRisco;

    @Column(name = "id_zona_risco_ref")
    private UUID zonaRiscoRef;

    @Column(name = "is_simulado", nullable = false)
    private boolean isSimulado = false;

    @Column(name = "cobrade_cod", length = 13)
    private String cobradeCod;

    @Column(name = "fide_municipio_afetado", length = 200)
    private String fideMunicipioAfetado;

    @Column(name = "fide_decreto_municipal", length = 100)
    private String fideDecretoMunicipal;

    @Column(name = "fide_data_decreto")
    private LocalDate fideDataDecreto;

    @Column(name = "fide_pop_afetada")
    private Integer fidePopAfetada;

    @Column(name = "fide_danos_materiais", columnDefinition = "text")
    private String fideDanosMateriais;

    @Column(name = "fide_acoes_resposta", columnDefinition = "text")
    private String fideAcoesResposta;

    @Column(name = "fide_recursos_solicitados", columnDefinition = "text")
    private String fideRecursosSolicitados;

    @Column(name = "fide_prejuizo_publico", precision = 15, scale = 2)
    private BigDecimal fidePrejuizoPublico;

    @Column(name = "fide_prejuizo_privado", precision = 15, scale = 2)
    private BigDecimal fidePrejuizoPrivado;

    @Column(name = "fide_danos_humanos_desc", columnDefinition = "text")
    private String fideDanosHumanosDesc;

    @Column(name = "fide_status", nullable = false, length = 20)
    private String fideStatus = "NAO_INICIADO";

    @Column(name = "pdr_referencia", length = 100)
    private String pdrReferencia;

    @Column(name = "pdr_url", length = 500)
    private String pdrUrl;

    @Column(name = "data_solicitacao", nullable = false)
    private OffsetDateTime dataSolicitacao = OffsetDateTime.now();

    @Column(name = "data_aprovacao")
    private OffsetDateTime dataAprovacao;

    @Column(name = "data_inicio")
    private OffsetDateTime dataInicio;

    @Column(name = "data_encerramento")
    private OffsetDateTime dataEncerramento;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
