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
}

