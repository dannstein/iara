package br.com.iara.iara_api.domain;

import br.com.iara.iara_api.security.crypto.AesGcmConverter;
import br.com.iara.iara_api.security.crypto.DeterministicAesConverter;
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
@Table(name = "iara_usuario")
@Getter
@Setter
@NoArgsConstructor
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    // LGPD:SENSIVEL — AES-256 randomizado
    @Convert(converter = AesGcmConverter.class)
    @Column(nullable = false, length = 512)
    private String nome;

    // LGPD:SENSIVEL — AES-256 determinístico (UNIQUE + findByEmail)
    @Convert(converter = DeterministicAesConverter.class)
    @Column(nullable = false, unique = true, length = 512)
    private String email;

    // LGPD:SENSIVEL — AES-256 randomizado
    @Convert(converter = AesGcmConverter.class)
    @Column(length = 512)
    private String telefone;

    // LGPD:SENSIVEL — CPF, AES-256 determinístico (UNIQUE + existsByDocumento)
    @Convert(converter = DeterministicAesConverter.class)
    @Column(nullable = false, unique = true, length = 512)
    private String documento;

    @Column(name = "foto_url", length = 500)
    private String fotoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_endereco")
    private Endereco endereco;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point localizacao;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "id_role", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_espec")
    private Espec espec;

    // LGPD:SENSIVEL — registro profissional, AES-256 randomizado
    @Convert(converter = AesGcmConverter.class)
    @Column(name = "doc_comprovacao_numero", length = 512)
    private String docComprovacaoNumero;

    @Column(name = "doc_comprovacao_url", length = 500)
    private String docComprovacaoUrl;

    @Column(name = "esta_disponivel", nullable = false)
    private boolean estaDisponivel = false;

    @Column(name = "cadastro_sts", nullable = false, length = 20)
    private String cadastroSts = "PENDENTE";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "data_aprovacao_cadastro")
    private OffsetDateTime dataAprovacaoCadastro;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_aprovador_cadastro")
    private Usuario aprovadorCadastro;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
