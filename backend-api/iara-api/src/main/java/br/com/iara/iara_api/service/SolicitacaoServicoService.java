package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.DocumentoGerado;
import br.com.iara.iara_api.domain.SolicitacaoServico;
import br.com.iara.iara_api.domain.Usuario;
import br.com.iara.iara_api.dto.servico.SolicitacaoServicoDTO;
import br.com.iara.iara_api.exception.BusinessException;
import br.com.iara.iara_api.exception.ForbiddenException;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.integration.FileStorageService;
import br.com.iara.iara_api.integration.PdfService;
import br.com.iara.iara_api.repository.DocumentoGeradoRepository;
import br.com.iara.iara_api.repository.SolicitacaoServicoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.security.TenantScope;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SolicitacaoServicoService {

    private final SolicitacaoServicoRepository repository;
    private final DocumentoGeradoRepository documentoRepository;
    private final FileStorageService fileStorageService;
    private final PdfService pdfService;
    private final br.com.iara.iara_api.integration.GeocodingService geocodingService;
    private final CurrentUser currentUser;
    private final TenantScope tenantScope;

    @Transactional
    public SolicitacaoServicoDTO criar(String tipo, String enderecoTxt, String descricaoMotivo,
                                       List<MultipartFile> fotos) {
        // RN26: mínimo 2 fotos
        if (fotos == null || fotos.size() < 2) {
            throw new BusinessException("RN26: são obrigatórias no mínimo 2 fotos");
        }
        Usuario u = currentUser.require();

        List<Map<String, Object>> fotosUrls = new ArrayList<>();
        int ordem = 1;
        for (MultipartFile foto : fotos) {
            String url = fileStorageService.store(foto, "solicitacoes");
            fotosUrls.add(Map.of("url", url, "ordem", ordem++));
        }

        SolicitacaoServico s = new SolicitacaoServico();
        s.setTenant(u.getTenant());
        s.setUsuario(u);
        s.setTipo(tipo);
        s.setEnderecoTxt(enderecoTxt);
        s.setGeometria(geocodingService.geocode(enderecoTxt)); // RN26 geocoding
        s.setDescricaoMotivo(descricaoMotivo);
        s.setFotosUrls(fotosUrls);
        s.setStatus("ABERTA");
        repository.save(s);

        // RN26: gera PDF de vistoria e registra o documento oficial
        PdfService.GeneratedPdf pdf = pdfService.gerarVistoria(Map.of(
                "id", s.getId().toString(), "tipo", tipo, "endereco", enderecoTxt,
                "motivo", descricaoMotivo, "fotos", fotosUrls));
        DocumentoGerado doc = new DocumentoGerado();
        doc.setSolicitacao(s);
        doc.setTipoDoc("FORMULARIO_VISTORIA");
        doc.setUrlPdfS3(pdf.urlPdf());
        doc.setHashSha256(pdf.hashSha256());
        documentoRepository.save(doc);

        return toDTO(s);
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoServicoDTO> minhas() {
        return repository.findByUsuarioIdOrderByCreatedAtDesc(currentUser.id())
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public SolicitacaoServicoDTO detalhar(UUID id) {
        return toDTO(buscar(id));
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoServicoDTO> listarTenant() {
        Usuario u = currentUser.require();
        return repository.findByTenantIdInOrderByCreatedAtDesc(tenantScope.visibleTenantIds(u))
                .stream().map(this::toDTO).toList();
    }

    @Transactional
    public SolicitacaoServicoDTO assumir(UUID id) {
        SolicitacaoServico s = buscarDoTenant(id);
        s.setStatus("EM_ATENDIMENTO");
        s.setResponsavel(currentUser.require());
        return toDTO(s);
    }

    @Transactional
    public SolicitacaoServicoDTO concluir(UUID id) {
        SolicitacaoServico s = buscarDoTenant(id);
        s.setStatus("CONCLUIDA");
        return toDTO(s);
    }

    @Transactional
    public SolicitacaoServicoDTO indeferir(UUID id, String parecer) {
        SolicitacaoServico s = buscarDoTenant(id);
        s.setStatus("INDEFERIDA");
        s.setObservacaoDc(parecer);
        return toDTO(s);
    }

    // -------------------------------------------------------------- helpers

    private SolicitacaoServico buscar(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Solicitação não encontrada"));
    }

    private SolicitacaoServico buscarDoTenant(UUID id) {
        Usuario u = currentUser.require();
        SolicitacaoServico s = buscar(id);
        if (!tenantScope.canSee(u, s.getTenant().getId())) {
            throw new ForbiddenException("Solicitação fora do seu escopo de tenant");
        }
        return s;
    }

    private SolicitacaoServicoDTO toDTO(SolicitacaoServico s) {
        List<String> pdfs = documentoRepository.findBySolicitacaoId(s.getId())
                .stream().map(DocumentoGerado::getUrlPdfS3).toList();
        return SolicitacaoServicoDTO.from(s, pdfs);
    }
}
