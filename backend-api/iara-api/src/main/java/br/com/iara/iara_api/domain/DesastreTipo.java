package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_desastre_tipo")
@Getter
@Setter
@NoArgsConstructor
public class DesastreTipo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "cobrade_cod", unique = true, length = 13)
    private String cobradeCod;

    @Column(name = "desastre_nome", nullable = false, unique = true, length = 100)
    private String desastreNome;

    @Column(name = "desastre_desc", length = 255)
    private String desastreDesc;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
