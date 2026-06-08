package br.com.iara.iara_api.dto.pc;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import br.com.iara.iara_api.dto.usuario.UpdateMeRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Request unificado de criação de PC (sub-fase 4A).
 *
 * <ul>
 *   <li><strong>Coordenador self-create</strong>: omite {@code idCoordenador} (auto = currentUser).
 *       PC nasce em {@code statusVerificacao=PENDENTE_VERIFICACAO_GESTOR}, {@code isActive=false}.</li>
 *   <li><strong>Gestor cria PC para coordenador</strong>: fornece {@code idCoordenador} e
 *       {@code endereco}. PC nasce VERIFICADO/ativo. Promove o usuário a COORDENADOR se rank menor.</li>
 * </ul>
 *
 * Quando {@code endereco.coordenadas} estão presentes têm precedência sobre {@code coordenadas}.
 */
public record CreatePcRequest(
        @NotBlank @Size(max = 200) String pcNome,
        String pcTipo,
        @Valid CoordenadasDTO coordenadas,
        String pcDesc,
        @Size(max = 100) String pcContato,
        UUID idCoordenador,
        @Valid UpdateMeRequest.EnderecoInput endereco
) {
}
