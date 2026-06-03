package br.com.iara.iara_api.repository;

import br.com.iara.iara_api.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByDocumento(String documento);

    List<Usuario> findByCadastroStsAndTenantIdIn(String cadastroSts, List<UUID> tenantIds);

    @Query("""
            select u from Usuario u
            where u.tenant.id in :tenantIds
              and (:role is null or u.role.roleNome = :role)
              and (:status is null or u.cadastroSts = :status)
              and (:especId is null or u.espec.id = :especId)
            order by u.createdAt desc
            """)
    List<Usuario> filtrar(@Param("tenantIds") List<UUID> tenantIds,
                          @Param("role") String role,
                          @Param("status") String status,
                          @Param("especId") UUID especId);

    /** Usuários com localização cadastrada dentro da geometria de uma zona de risco ativa. */
    @Query(value = """
            select u.* from iara_usuario u
            where u.localizacao is not null
              and u.id_tenant = :tenantId
              and ST_Within(u.localizacao,
                    (select z.geometria from iara_zona_risco z where z.id = :zonaId))
            """, nativeQuery = true)
    List<Usuario> usuariosEmZonaRisco(@Param("zonaId") UUID zonaId, @Param("tenantId") UUID tenantId);

    /** Usuários com localização cadastrada dentro do raio (metros) de um evento. */
    @Query(value = """
            select u.* from iara_usuario u
            where u.localizacao is not null
              and u.id_tenant = :tenantId
              and ST_DWithin(
                    u.localizacao::geography,
                    (select e.coordenadas::geography from iara_evento e where e.id = :eventoId),
                    :raioMetros)
            """, nativeQuery = true)
    List<Usuario> usuariosNoRaioDoEvento(@Param("eventoId") UUID eventoId,
                                         @Param("raioMetros") int raioMetros,
                                         @Param("tenantId") UUID tenantId);

    /** Usuários com endereço residencial dentro da geometria de uma zona de risco. */
    @Query(value = """
            select u.* from iara_usuario u
            join iara_endereco e on e.id = u.id_endereco
            where e.coordenadas is not null
              and u.id_tenant = :tenantId
              and ST_Within(e.coordenadas,
                    (select z.geometria from iara_zona_risco z where z.id = :zonaId))
            """, nativeQuery = true)
    List<Usuario> usuariosComEnderecoEmZonaRisco(@Param("zonaId") UUID zonaId,
                                                  @Param("tenantId") UUID tenantId);

    /** Usuários com endereço residencial dentro do raio (metros) de um evento. */
    @Query(value = """
            select u.* from iara_usuario u
            join iara_endereco e on e.id = u.id_endereco
            where e.coordenadas is not null
              and u.id_tenant = :tenantId
              and ST_DWithin(
                    e.coordenadas::geography,
                    (select ev.coordenadas::geography from iara_evento ev where ev.id = :eventoId),
                    :raioMetros)
            """, nativeQuery = true)
    List<Usuario> usuariosComEnderecoNoRaioDoEvento(@Param("eventoId") UUID eventoId,
                                                     @Param("raioMetros") int raioMetros,
                                                     @Param("tenantId") UUID tenantId);

    /** Usuários no raio de uma coordenada (geofencing personalizado, qualquer role). */
    @Query(value = """
            select u.* from iara_usuario u
            where u.localizacao is not null
              and u.id_tenant in (:tenantIds)
              and ST_DWithin(
                    u.localizacao::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raioMetros)
            """, nativeQuery = true)
    List<Usuario> usuariosNoRaio(@Param("lat") double lat, @Param("lng") double lng,
                                  @Param("raioMetros") int raioMetros,
                                  @Param("tenantIds") List<UUID> tenantIds);

    /** Usuários com endereço residencial no raio de uma coordenada. */
    @Query(value = """
            select u.* from iara_usuario u
            join iara_endereco e on e.id = u.id_endereco
            where e.coordenadas is not null
              and u.id_tenant in (:tenantIds)
              and ST_DWithin(
                    e.coordenadas::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raioMetros)
            """, nativeQuery = true)
    List<Usuario> usuariosComEnderecoNoRaio(@Param("lat") double lat, @Param("lng") double lng,
                                             @Param("raioMetros") int raioMetros,
                                             @Param("tenantIds") List<UUID> tenantIds);

    /** Todos os usuários aprovados de um conjunto de tenants, opcionalmente filtrados por role. */
    @Query("""
            select u from Usuario u
            where u.tenant.id in :tenantIds
              and u.cadastroSts = 'APROVADO'
              and (:role is null or u.role.roleNome = :role)
            """)
    List<Usuario> aprovadosPorTenantsERole(@Param("tenantIds") List<UUID> tenantIds,
                                            @Param("role") String role);

    /**
     * Técnicos aprovados e disponíveis dentro do raio (em metros) de uma coordenada (query 2 do DDL).
     * Ordenados por distância ascendente. especId opcional (String para permitir cast/NULL no native).
     */
    @Query(value = """
            select u.* from iara_usuario u
            join iara_role r on r.id = u.id_role
            where r.role_nome = 'TECNICO'
              and u.esta_disponivel = true
              and u.cadastro_sts = 'APROVADO'
              and u.localizacao is not null
              and (cast(:especId as uuid) is null or u.id_espec = cast(:especId as uuid))
              and ST_DWithin(
                    u.localizacao::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
            order by ST_Distance(
                    u.localizacao::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) asc
            """, nativeQuery = true)
    List<Usuario> tecnicosDisponiveis(@Param("lat") double lat, @Param("lng") double lng,
                                      @Param("raio") int raio, @Param("especId") String especId);

    /**
     * Técnicos disponíveis em um raio EXCLUINDO os já presentes em iara_alerta_destinatario
     * do alerta indicado. Usado pelo {@code AlertaRadiusExpansionJob} para identificar somente
     * os novos usuários do passo de expansão.
     */
    @Query(value = """
            select u.* from iara_usuario u
            join iara_role r on r.id = u.id_role
            where r.role_nome = 'TECNICO'
              and u.esta_disponivel = true
              and u.cadastro_sts = 'APROVADO'
              and u.localizacao is not null
              and (cast(:especId as uuid) is null or u.id_espec = cast(:especId as uuid))
              and ST_DWithin(
                    u.localizacao::geography,
                    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                    :raio)
              and not exists (
                    select 1 from iara_alerta_destinatario d
                    where d.id_alerta = cast(:alertaId as uuid) and d.id_usuario = u.id
              )
            """, nativeQuery = true)
    List<Usuario> tecnicosNovosNoRaio(@Param("lat") double lat, @Param("lng") double lng,
                                       @Param("raio") int raio, @Param("especId") String especId,
                                       @Param("alertaId") String alertaId);

    // ----------------------------------------------------- Fase 2C — modos históricos

    /**
     * Usuários que passaram por um ponto/raio nas últimas {@code lastHours} horas,
     * conforme histórico em {@code iara_usuario_localizacao_historico}.
     */
    @Query(value = """
            select distinct u.* from iara_usuario u
            where u.id_tenant in (:tenantIds)
              and u.cadastro_sts = 'APROVADO'
              and exists (
                  select 1 from iara_usuario_localizacao_historico h
                  where h.id_usuario = u.id
                    and h.captured_at > now() - make_interval(hours => :lastHours)
                    and ST_DWithin(
                          h.coordenadas::geography,
                          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                          :raioMetros)
              )
            """, nativeQuery = true)
    List<Usuario> usuariosQuePassaramPela(@Param("lat") double lat, @Param("lng") double lng,
                                          @Param("raioMetros") int raioMetros,
                                          @Param("lastHours") int lastHours,
                                          @Param("tenantIds") List<UUID> tenantIds);

    /**
     * Usuários frequentemente presentes no ponto/raio: ao menos {@code minDays} dias
     * distintos com registro nos últimos {@code lastDays} dias.
     */
    @Query(value = """
            select u.* from iara_usuario u
            where u.id_tenant in (:tenantIds)
              and u.cadastro_sts = 'APROVADO'
              and u.id in (
                  select h.id_usuario
                    from iara_usuario_localizacao_historico h
                   where h.captured_at > now() - make_interval(days => :lastDays)
                     and ST_DWithin(
                           h.coordenadas::geography,
                           ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                           :raioMetros)
                   group by h.id_usuario
                  having count(distinct date_trunc('day', h.captured_at)) >= :minDays
              )
            """, nativeQuery = true)
    List<Usuario> usuariosFrequentesNo(@Param("lat") double lat, @Param("lng") double lng,
                                       @Param("raioMetros") int raioMetros,
                                       @Param("minDays") int minDays,
                                       @Param("lastDays") int lastDays,
                                       @Param("tenantIds") List<UUID> tenantIds);
}

