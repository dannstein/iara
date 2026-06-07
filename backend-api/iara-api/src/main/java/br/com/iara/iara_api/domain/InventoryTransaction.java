package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Transação de inventário do PC (sub-fase 4D) — append-only, imutável.
 * Cada operação que mexe em estoque/intenção/demanda cria uma linha aqui.
 * RULES no banco bloqueiam UPDATE/DELETE.
 *
 * Operações: INTENT_CREATED, INTENT_CANCELLED, INTENT_EXPIRED, RECEIVED,
 * DISTRIBUTED, ADJUSTED, RESET_END_EVENT.
 */
@Entity
@Table(name = "iara_inventory_transaction")
@Getter
@Setter
@NoArgsConstructor
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "id_pc", nullable = false)
    private UUID pcId;

    @Column(name = "id_evento")
    private UUID eventoId;

    @Column(name = "id_tipo", nullable = false)
    private UUID tipoId;

    @Column(nullable = false, length = 30)
    private String operacao;

    @Column(nullable = false)
    private int quantidade;

    @Column(name = "id_usuario", nullable = false)
    private UUID usuarioId;

    @Column(name = "id_intencao")
    private UUID intencaoId;

    @Column(name = "id_demanda")
    private UUID demandaId;

    @Column(columnDefinition = "text")
    private String observacao;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
