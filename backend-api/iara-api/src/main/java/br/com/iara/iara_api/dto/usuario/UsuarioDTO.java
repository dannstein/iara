package br.com.iara.iara_api.dto.usuario;

import br.com.iara.iara_api.domain.Usuario;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UsuarioDTO(
        UUID id,
        String nome,
        String email,
        String telefone,
        String documento,
        String role,
        UUID tenantId,
        UUID especId,
        String cadastroSts,
        boolean estaDisponivel,
        String fotoUrl,
        String docComprovacaoNumero,
        String docComprovacaoUrl,
        OffsetDateTime createdAt
) {
    public static UsuarioDTO from(Usuario u) {
        return new UsuarioDTO(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getTelefone(),
                u.getDocumento(),
                u.getRole().getRoleNome(),
                u.getTenant().getId(),
                u.getEspec() != null ? u.getEspec().getId() : null,
                u.getCadastroSts(),
                u.isEstaDisponivel(),
                u.getFotoUrl(),
                u.getDocComprovacaoNumero(),
                u.getDocComprovacaoUrl(),
                u.getCreatedAt()
        );
    }
}
