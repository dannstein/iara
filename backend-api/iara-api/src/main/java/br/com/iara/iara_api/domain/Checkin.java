package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_checkin")
@Getter
@Setter
@NoArgsConstructor
public class Checkin {

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

    @Column(name = "data_checkin", nullable = false)
    private OffsetDateTime dataCheckin = OffsetDateTime.now();

    @Column(name = "data_checkout")
    private OffsetDateTime dataCheckout;

    @Column(name = "data_sincronizacao")
    private OffsetDateTime dataSincronizacao;
}
