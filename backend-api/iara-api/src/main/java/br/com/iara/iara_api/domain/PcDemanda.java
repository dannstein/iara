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
}
