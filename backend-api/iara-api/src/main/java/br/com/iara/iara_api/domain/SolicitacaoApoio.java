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
@Table(name = "iara_solicitacao_apoio")
@Getter
@Setter
@NoArgsConstructor
public class SolicitacaoApoio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_origem", nullable = false)
    private Usuario origem;

    @Column(name = "id_pc")
    private UUID pcId;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    @Column(nullable = false, length = 20)
    private String status = "ABERTA";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_resp")
    private Usuario responsavel;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
