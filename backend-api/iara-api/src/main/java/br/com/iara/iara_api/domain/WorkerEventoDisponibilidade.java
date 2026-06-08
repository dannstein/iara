package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Disponibilidade per-evento dos workers de um PC (sub-fase 4B). Quando o
 * coordenador aceita um evento, o sistema cria uma linha PENDENTE para cada
 * worker (Helper confirmado). O worker responde via PATCH dedicado.
 *
 * <p>UNIQUE(pcEvento, usuario): cada worker tem no máximo uma resposta por evento.</p>
 */
@Entity
@Table(name = "iara_worker_evento_disponibilidade")
@Getter
@Setter
@NoArgsConstructor
public class WorkerEventoDisponibilidade {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pc_evento", nullable = false)
    private PcEvento pcEvento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 20)
    private String status = "PENDENTE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_motivo_recusa")
    private PcMotivoRecusa motivoRecusa;

    @Column(name = "motivo_descricao", columnDefinition = "text")
    private String motivoDescricao;

    @Column(name = "data_solicitacao", nullable = false)
    private OffsetDateTime dataSolicitacao = OffsetDateTime.now();

    @Column(name = "data_resposta")
    private OffsetDateTime dataResposta;

    @Version
    @Column(nullable = false)
    private int version;
}
