package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "iara_solicitacao_servico")
@Getter
@Setter
@NoArgsConstructor
public class SolicitacaoServico {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 30)
    private String tipo;

    @Column(name = "endereco_txt", nullable = false, length = 500)
    private String enderecoTxt;

    @Column(columnDefinition = "geometry(Point,4326)")
    private Point geometria;

    @Column(name = "descricao_motivo", nullable = false, columnDefinition = "text")
    private String descricaoMotivo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "fotos_urls", nullable = false, columnDefinition = "jsonb")
    private List<Map<String, Object>> fotosUrls;

    @Column(nullable = false, length = 20)
    private String status = "ABERTA";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usu_resp")
    private Usuario responsavel;

    @Column(name = "observacao_dc", columnDefinition = "text")
    private String observacaoDc;

    @Column(length = 20)
    private String prioridade;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private OffsetDateTime updatedAt;
}
