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
@Table(name = "iara_incidentes")
@Getter
@Setter
@NoArgsConstructor
public class Incidentes {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @Column(nullable = false)
    private int mortos = 0;

    @Column(nullable = false)
    private int feridos = 0;

    @Column(nullable = false)
    private int desabrigados = 0;

    @Column(nullable = false)
    private int desaparecidos = 0;

    @Column(name = "start_vermelho", nullable = false)
    private int startVermelho = 0;

    @Column(name = "start_amarelo", nullable = false)
    private int startAmarelo = 0;

    @Column(name = "start_verde", nullable = false)
    private int startVerde = 0;

    @Column(name = "start_preto", nullable = false)
    private int startPreto = 0;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_cad", nullable = false)
    private Usuario cadastradoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_alt")
    private Usuario alteradoPor;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
