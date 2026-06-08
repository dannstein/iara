package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Catálogo de motivos predefinidos de recusa de PcEvento e de
 * {@link WorkerEventoDisponibilidade} (sub-fase 4B). Seedado via V17.
 */
@Entity
@Table(name = "iara_pc_motivo_recusa")
@Getter
@Setter
@NoArgsConstructor
public class PcMotivoRecusa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 40, unique = true)
    private String codigo;

    @Column(nullable = false, length = 150)
    private String label;

    @Column(name = "exige_descricao", nullable = false)
    private boolean exigeDescricao = false;

    @Column(nullable = false)
    private boolean ativo = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
