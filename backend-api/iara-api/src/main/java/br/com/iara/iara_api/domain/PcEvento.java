package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_pc_evento")
@Getter
@Setter
@NoArgsConstructor
public class PcEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pc", nullable = false)
    private Pc pc;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @Column(nullable = false, length = 20)
    private String status = "NOTIFICADO";

    @CreationTimestamp
    @Column(name = "data_notificacao", nullable = false, updatable = false)
    private OffsetDateTime dataNotificacao;

    @Column(name = "data_resposta")
    private OffsetDateTime dataResposta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_resp")
    private Usuario responsavel;

    // ----- Fase 4B: motivo de recusa + optimistic locking -----

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_motivo_recusa")
    private PcMotivoRecusa motivoRecusa;

    @Column(name = "motivo_recusa_descricao", columnDefinition = "text")
    private String motivoRecusaDescricao;

    @Version
    @Column(nullable = false)
    private int version;
}
