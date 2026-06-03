package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_notificacao_envio")
@Getter
@Setter
@NoArgsConstructor
public class NotificacaoEnvio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "id_alerta", nullable = false)
    private UUID alertaId;

    @Column(name = "id_usuario", nullable = false)
    private UUID usuarioId;

    @Column(nullable = false, length = 20)
    private String canal;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "text")
    private String erro;

    @Column(name = "sent_at", nullable = false)
    private OffsetDateTime sentAt = OffsetDateTime.now();
}
