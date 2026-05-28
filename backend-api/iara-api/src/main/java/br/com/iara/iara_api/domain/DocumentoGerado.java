package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "iara_documento_gerado")
@Getter
@Setter
@NoArgsConstructor
public class DocumentoGerado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitacao", nullable = false)
    private SolicitacaoServico solicitacao;

    @Column(name = "tipo_doc", nullable = false, length = 50)
    private String tipoDoc = "FORMULARIO_VISTORIA";

    @Column(name = "url_pdf_s3", nullable = false, length = 500)
    private String urlPdfS3;

    @Column(name = "gerado_em", nullable = false)
    private OffsetDateTime geradoEm = OffsetDateTime.now();

    @Column(name = "hash_sha256", length = 64)
    private String hashSha256;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
