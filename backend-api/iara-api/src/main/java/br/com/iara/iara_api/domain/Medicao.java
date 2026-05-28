package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "iara_medicao")
@Getter
@Setter
@NoArgsConstructor
public class Medicao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_estacao", nullable = false)
    private EstacaoMonitoramento estacao;

    @Column(name = "data_medicao", nullable = false)
    private OffsetDateTime dataMedicao;

    @Column(name = "chuva_mm", precision = 7, scale = 2)
    private BigDecimal chuvaMm;

    @Column(name = "nivel_rio_m", precision = 7, scale = 2)
    private BigDecimal nivelRioM;

    @Column(name = "temperatura_c", precision = 5, scale = 2)
    private BigDecimal temperaturaC;

    @Column(name = "umidade_pct", precision = 5, scale = 2)
    private BigDecimal umidadePct;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dados_raw", columnDefinition = "jsonb")
    private Map<String, Object> dadosRaw;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
