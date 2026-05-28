package br.com.iara.iara_api.domain;

import br.com.iara.iara_api.security.crypto.AesGcmConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_morgue")
@Getter
@Setter
@NoArgsConstructor
public class Morgue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_triagem")
    private VitimaTriagem triagem;

    @Column(name = "codigo_morgue", nullable = false, length = 20)
    private String codigoMorgue;

    // LGPD:SENSIVEL — AES-256
    @Convert(converter = AesGcmConverter.class)
    @Column(name = "nome_identificado", length = 512)
    private String nomeIdentificado;

    // LGPD:SENSIVEL — CPF, AES-256
    @Convert(converter = AesGcmConverter.class)
    @Column(length = 512)
    private String documento;

    @Column(name = "idade_estimada")
    private Short idadeEstimada;

    @Column(length = 1)
    private String sexo;

    @Column(name = "local_encontrado", nullable = false, columnDefinition = "geometry(Point,4326)")
    private Point localEncontrado;

    @Column(name = "descricao_local", length = 255)
    private String descricaoLocal;

    @Column(name = "local_remocao", length = 255)
    private String localRemocao;

    @Column(name = "data_remocao")
    private OffsetDateTime dataRemocao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_registro", nullable = false)
    private Usuario registradoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_remocao")
    private Usuario removidoPor;

    @Column(columnDefinition = "text")
    private String observacoes;

    @Column(name = "data_sincronizacao")
    private OffsetDateTime dataSincronizacao;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
