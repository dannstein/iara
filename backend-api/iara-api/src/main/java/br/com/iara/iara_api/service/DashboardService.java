package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * KPIs do painel (RF10). Sempre filtrado pelo escopo de tenant; eventos/incidentes
 * excluem simulados por padrão. Consultas nativas agregadas (queries 9+ do DDL).
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    @PersistenceContext
    private EntityManager em;

    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    private List<UUID> tenants() {
        Usuario u = currentUser.require();
        return tenantScope.visibleTenantIds(u);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> eventos(boolean incluirSimulados) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
                select status, count(*) from iara_evento
                where id_tenant in (:tenantIds) and (:sim or is_simulado = false)
                group by status
                """).setParameter("tenantIds", tenants())
                .setParameter("sim", incluirSimulados).getResultList();
        Map<String, Object> out = new LinkedHashMap<>();
        long total = 0;
        for (Object[] r : rows) {
            long c = ((Number) r[1]).longValue();
            out.put((String) r[0], c);
            total += c;
        }
        out.put("total", total);
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> incidentes(boolean incluirSimulados) {
        Object[] r = (Object[]) em.createNativeQuery("""
                select coalesce(sum(mortos),0), coalesce(sum(feridos),0),
                       coalesce(sum(desabrigados),0), coalesce(sum(desaparecidos),0),
                       coalesce(sum(start_vermelho),0), coalesce(sum(start_amarelo),0),
                       coalesce(sum(start_verde),0), coalesce(sum(start_preto),0)
                from iara_incidentes i
                where i.created_at = (select max(created_at) from iara_incidentes i2 where i2.id_evento = i.id_evento)
                  and i.id_evento in (
                      select id from iara_evento where id_tenant in (:tenantIds) and (:sim or is_simulado = false))
                """).setParameter("tenantIds", tenants())
                .setParameter("sim", incluirSimulados).getSingleResult();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("mortos", num(r[0]));
        out.put("feridos", num(r[1]));
        out.put("desabrigados", num(r[2]));
        out.put("desaparecidos", num(r[3]));
        out.put("start_vermelho", num(r[4]));
        out.put("start_amarelo", num(r[5]));
        out.put("start_verde", num(r[6]));
        out.put("start_preto", num(r[7]));
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> doacoes() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
                select dt.d_nome, coalesce(sum(di.quantidade),0)
                from iara_doacao_intencao di
                join iara_demanda_tipo dt on dt.id = di.id_tipo
                where di.status = 'CONFIRMADA'
                  and di.id_pc in (select id from iara_pc where id_tenant in (:tenantIds))
                group by dt.d_nome
                """).setParameter("tenantIds", tenants()).getResultList();
        Map<String, Object> out = new LinkedHashMap<>();
        for (Object[] r : rows) {
            out.put((String) r[0], num(r[1]));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> tecnicos() {
        Number disponiveis = (Number) em.createNativeQuery("""
                select count(*) from iara_usuario u join iara_role r on r.id = u.id_role
                where r.role_nome = 'TECNICO' and u.esta_disponivel = true
                  and u.cadastro_sts = 'APROVADO' and u.id_tenant in (:tenantIds)
                """).setParameter("tenantIds", tenants()).getSingleResult();
        return Map.of("tecnicos_disponiveis", disponiveis.longValue());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> abrigos() {
        Object[] r = (Object[]) em.createNativeQuery("""
                select count(*), coalesce(sum(ocupacao_atual),0), coalesce(sum(capacidade_total),0)
                from iara_abrigo where id_tenant in (:tenantIds) and is_active = true
                """).setParameter("tenantIds", tenants()).getSingleResult();
        return Map.of("abrigos", num(r[0]), "ocupacao_total", num(r[1]), "capacidade_total", num(r[2]));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> pcs() {
        Number pcs = (Number) em.createNativeQuery(
                "select count(*) from iara_pc where id_tenant in (:tenantIds) and is_active = true")
                .setParameter("tenantIds", tenants()).getSingleResult();
        Number demandasPendentes = (Number) em.createNativeQuery("""
                select count(*) from iara_pc_demanda d
                where d.is_active = true and d.qtd_atendida < d.qtd_solicitada
                  and d.id_pc in (select id from iara_pc where id_tenant in (:tenantIds))
                """).setParameter("tenantIds", tenants()).getSingleResult();
        return Map.of("pcs_ativos", pcs.longValue(), "demandas_pendentes", demandasPendentes.longValue());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> pontosAtencao() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery("""
                select situacao_apoio, count(*) from iara_ponto_atencao
                where id_tenant in (:tenantIds) and is_active = true
                group by situacao_apoio
                """).setParameter("tenantIds", tenants()).getResultList();
        Map<String, Object> out = new LinkedHashMap<>();
        for (Object[] r : rows) {
            out.put((String) r[0], num(r[1]));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> zonasRisco() {
        Object[] r = (Object[]) em.createNativeQuery("""
                select
                  coalesce(sum(case when ap.cnt = 0 then 1 else 0 end), 0) as sem_apoio,
                  coalesce(sum(case when ap.cnt > 0 then 1 else 0 end), 0) as com_apoio
                from iara_zona_risco z
                left join lateral (
                    select count(*) cnt from iara_ponto_apoio_geral p
                    where p.id_zona_risco = z.id and p.is_active = true
                ) ap on true
                where z.id_tenant in (:tenantIds) and z.is_active = true
                """).setParameter("tenantIds", tenants()).getSingleResult();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("SEM_APOIO", num(r[0]));
        out.put("COM_APOIO", num(r[1]));
        return out;
    }

    private long num(Object o) {
        return ((Number) o).longValue();
    }
}
