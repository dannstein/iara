package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Linha do tempo de atendimento de uma Solicitação de Serviço (prevenção). */
@Entity
@Table(name = "iara_solicitacao_historico")
@Getter
@Setter
@NoArgsConstructor
public class SolicitacaoHistorico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitacao", nullable = false)
    private SolicitacaoServico solicitacao;

    @Column(name = "status_para", nullable = false, length = 20)
    private String statusPara;

    @Column(columnDefinition = "text")
    private String observacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_responsavel")
    private Usuario responsavel;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
