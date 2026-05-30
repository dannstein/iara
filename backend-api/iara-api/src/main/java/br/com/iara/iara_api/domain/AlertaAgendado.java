package br.com.iara.iara_api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "iara_alerta_agendado")
@Getter
@Setter
@NoArgsConstructor
public class AlertaAgendado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_tenant", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usu_criou", nullable = false)
    private Usuario criador;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false, length = 30)
    private String categoria;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "tipo_recorrencia", nullable = false, length = 20)
    private String tipoRecorrencia;

    @Column(nullable = false)
    private OffsetDateTime inicio;

    @Column
    private OffsetDateTime fim;

    @Column
    private LocalTime horario;

    @Column(name = "dia_semana")
    private Integer diaSemana;

    @Column(name = "dia_mes")
    private Integer diaMes;

    @Column(name = "intervalo_horas")
    private Integer intervaloHoras;

    @Column(name = "is_ativo", nullable = false)
    private boolean isAtivo = true;

    @Column(name = "ultima_execucao")
    private OffsetDateTime ultimaExecucao;

    @Column(name = "proxima_execucao", nullable = false)
    private OffsetDateTime proximaExecucao;

    @Column(name = "total_disparos", nullable = false)
    private int totalDisparos = 0;

    @Column(name = "ultimo_erro", columnDefinition = "text")
    private String ultimoErro;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
