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
@Table(name = "iara_doacao_intencao")
@Getter
@Setter
@NoArgsConstructor
public class DoacaoIntencao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pc", nullable = false)
    private Pc pc;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_demanda", nullable = false)
    private PcDemanda demanda;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tipo", nullable = false)
    private DemandaTipo tipo;

    @Column(nullable = false)
    private int quantidade;

    @Column(length = 255)
    private String descricao;

    @Column(nullable = false, length = 20)
    private String status = "PENDENTE";

    @Column(name = "data_prevista")
    private OffsetDateTime dataPrevista;

    @Column(name = "data_confirmacao")
    private OffsetDateTime dataConfirmacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_confirmou")
    private Usuario confirmadoPor;

    @Column(name = "pdr_referencia", length = 100)
    private String pdrReferencia;

    @Column(name = "data_sincronizacao")
    private OffsetDateTime dataSincronizacao;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    // ----- Fase 4D: tracking + expiração + optimistic locking -----

    @Column(name = "qtd_recebida", nullable = false)
    private int qtdRecebida = 0;

    /** Default now+48h (definido no service). Job expira PENDENTE com data_expiracao < now. */
    @Column(name = "data_expiracao")
    private OffsetDateTime dataExpiracao;

    @Version
    @Column(nullable = false)
    private int version;
}
