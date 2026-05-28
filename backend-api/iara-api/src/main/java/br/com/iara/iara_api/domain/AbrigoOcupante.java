package br.com.iara.iara_api.domain;

import br.com.iara.iara_api.security.crypto.AesGcmConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_abrigo_ocupante")
@Getter
@Setter
@NoArgsConstructor
public class AbrigoOcupante {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_abrigo", nullable = false)
    private Abrigo abrigo;

    // LGPD:SENSIVEL — AES-256
    @Convert(converter = AesGcmConverter.class)
    @Column(nullable = false, length = 512)
    private String nome;

    // LGPD:SENSIVEL — AES-256
    @Convert(converter = AesGcmConverter.class)
    @Column(length = 512)
    private String documento;

    @Column
    private Short idade;

    @Column(name = "is_idoso", nullable = false)
    private boolean isIdoso = false;

    @Column(name = "is_crianca", nullable = false)
    private boolean isCrianca = false;

    @Column(name = "is_pcd", nullable = false)
    private boolean isPcd = false;

    @Column(name = "is_gestante", nullable = false)
    private boolean isGestante = false;

    // GENERATED ALWAYS no banco — somente leitura
    @Column(name = "is_prioridade", insertable = false, updatable = false)
    private Boolean isPrioridade;

    @Column(name = "necessidade_especial_tipo", length = 255)
    private String necessidadeEspecialTipo;

    @Column(columnDefinition = "text")
    private String observacoes;

    @Column(name = "data_entrada", nullable = false)
    private OffsetDateTime dataEntrada = OffsetDateTime.now();

    @Column(name = "data_saida")
    private OffsetDateTime dataSaida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_cad")
    private Usuario cadastradoPor;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
