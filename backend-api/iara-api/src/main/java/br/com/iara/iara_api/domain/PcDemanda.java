package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_pc_demanda")
@Getter
@Setter
@NoArgsConstructor
public class PcDemanda {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pc", nullable = false)
    private Pc pc;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tipo", nullable = false)
    private DemandaTipo tipo;

    @Column(nullable = false, length = 10)
    private String prioridade = "MEDIA";

    @Column(name = "qtd_solicitada", nullable = false)
    private int qtdSolicitada;

    @Column(name = "qtd_atendida", nullable = false)
    private int qtdAtendida = 0;

    @Column(columnDefinition = "text")
    private String descricao;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_cad", nullable = false)
    private Usuario cadastradoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_alt")
    private Usuario alteradoPor;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    // ----- Fase 4C: lifecycle status + tracking quantitativo -----

    /** OPEN | PARTIALLY_FULFILLED | FULFILLED | CLOSED. */
    @Column(nullable = false, length = 30)
    private String status = "OPEN";

    @Column(name = "qtd_recebida", nullable = false)
    private int qtdRecebida = 0;

    @Column(name = "qtd_intencionada", nullable = false)
    private int qtdIntencionada = 0;

    /** Limite hard da demanda (opcional — usado para barrar criação acima da capacidade). */
    @Column(name = "qtd_maxima_capacidade")
    private Integer qtdMaximaCapacidade;

    @Column(name = "data_fechamento")
    private OffsetDateTime dataFechamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_fechou")
    private Usuario fechadoPor;

    @Version
    @Column(nullable = false)
    private int version;
}
