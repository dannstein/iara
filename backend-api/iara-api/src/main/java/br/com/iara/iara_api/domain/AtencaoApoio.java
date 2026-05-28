package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Vínculo XOR: exatamente uma de (pc, abrigo, pontoApoio) preenchida por linha (RN21).
 */
@Entity
@Table(name = "iara_atencao_apoio")
@Getter
@Setter
@NoArgsConstructor
public class AtencaoApoio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_ponto_atencao", nullable = false)
    private PontoAtencao pontoAtencao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_pc")
    private Pc pc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_abrigo")
    private Abrigo abrigo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ponto_apoio")
    private PontoApoio pontoApoio;

    @Column(length = 255)
    private String observacao;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
