package br.com.iara.iara_api.domain;

import br.com.iara.iara_api.security.crypto.AesGcmConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_recurso_dc_evento")
@Getter
@Setter
@NoArgsConstructor
public class RecursoDcEvento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_recurso", nullable = false)
    private RecursoDc recurso;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_alocou", nullable = false)
    private Usuario alocouPor;

    // LGPD:SENSIVEL — AES-256
    @Convert(converter = AesGcmConverter.class)
    @Column(name = "condutor_nome", length = 512)
    private String condutorNome;

    @Convert(converter = AesGcmConverter.class)
    @Column(name = "condutor_contato", length = 512)
    private String condutorContato;

    @Column(name = "condutor_habilitacao", length = 20)
    private String condutorHabilitacao;

    @Column(name = "responsavel_nome", length = 150)
    private String responsavelNome;

    @Column(name = "responsavel_contato", length = 20)
    private String responsavelContato;

    @CreationTimestamp
    @Column(name = "data_alocacao", nullable = false, updatable = false)
    private OffsetDateTime dataAlocacao;

    @Column(name = "data_liberacao")
    private OffsetDateTime dataLiberacao;

    @Column(length = 255)
    private String observacao;
}
