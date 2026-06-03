package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Preferências de notificação de um usuário. Linha existe apenas se o usuário
 * já personalizou alguma preferência; ausência = receber tudo.
 */
@Entity
@Table(name = "iara_usuario_notificacao_pref")
@Getter
@Setter
@NoArgsConstructor
public class UsuarioNotificacaoPref {

    @Id
    @Column(name = "id_usuario")
    private UUID idUsuario;

    @Column(name = "categorias_silenciadas", columnDefinition = "text")
    private String categoriasSilenciadas;

    @Column(name = "severidades_silenciadas", columnDefinition = "text")
    private String severidadesSilenciadas;

    @Column(name = "nao_perturbe", nullable = false)
    private boolean naoPerturbe = false;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
