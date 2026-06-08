package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Capacidade máxima por (PC, tipo de demanda) — sub-fase 4C.
 * Quando uma demanda nova é criada sem {@code qtdMaximaCapacidade} explícita
 * o service aplica este default. Linha ausente = sem capacidade configurada.
 */
@Entity
@Table(name = "iara_pc_capacidade")
@IdClass(PcCapacidade.Key.class)
@Getter
@Setter
@NoArgsConstructor
public class PcCapacidade {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_pc", nullable = false)
    private Pc pc;

    @Id
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tipo", nullable = false)
    private DemandaTipo tipo;

    @Column(name = "qtd_maxima", nullable = false)
    private int qtdMaxima;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alterado_por")
    private Usuario alteradoPor;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Version
    @Column(nullable = false)
    private int version;

    /** Chave composta (pc, tipo) — necessária pro {@link IdClass}. */
    public static class Key implements Serializable {
        private UUID pc;
        private UUID tipo;

        public Key() {}

        public Key(UUID pc, UUID tipo) {
            this.pc = pc;
            this.tipo = tipo;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key k)) return false;
            return Objects.equals(pc, k.pc) && Objects.equals(tipo, k.tipo);
        }

        @Override
        public int hashCode() {
            return Objects.hash(pc, tipo);
        }
    }
}
