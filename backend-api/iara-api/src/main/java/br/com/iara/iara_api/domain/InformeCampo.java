package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_informe_campo")
@Getter
@Setter
@NoArgsConstructor
public class InformeCampo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_evento", nullable = false)
    private Evento evento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point coordenadas;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    @Column(name = "anexo_url", length = 500)
    private String anexoUrl;

    @Column(name = "canal_envio", nullable = false, length = 10)
    private String canalEnvio = "INTERNET";

    @Column(name = "data_sincronizacao")
    private OffsetDateTime dataSincronizacao;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
