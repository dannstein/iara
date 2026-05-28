package br.com.iara.iara_api.service;

import br.com.iara.iara_api.domain.Evento;
import br.com.iara.iara_api.domain.InformeCampo;
import br.com.iara.iara_api.dto.evento.InformeDTO;
import br.com.iara.iara_api.exception.NotFoundException;
import br.com.iara.iara_api.integration.FileStorageService;
import br.com.iara.iara_api.repository.InformeCampoRepository;
import br.com.iara.iara_api.security.CurrentUser;
import br.com.iara.iara_api.util.geo.GeoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InformeService {

    private final InformeCampoRepository informeRepository;
    private final FileStorageService fileStorageService;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    @Transactional
    public InformeDTO criar(UUID eventoId, String descricao, Double lat, Double lng,
                            String canalEnvio, MultipartFile anexo, OffsetDateTime dataSincronizacao) {
        Evento e = eventoService.buscarVisivel(eventoId);
        InformeCampo i = new InformeCampo();
        i.setEvento(e);
        i.setUsuario(currentUser.require());
        i.setDescricao(descricao);
        i.setCanalEnvio(canalEnvio != null ? canalEnvio : "INTERNET");
        if (lat != null && lng != null) {
            i.setCoordenadas(GeoUtil.point(lat, lng));
        }
        if (anexo != null && !anexo.isEmpty()) {
            i.setAnexoUrl(fileStorageService.store(anexo, "informes"));
        }
        i.setDataSincronizacao(dataSincronizacao);
        return InformeDTO.from(informeRepository.save(i));
    }

    @Transactional(readOnly = true)
    public List<InformeDTO> listar(UUID eventoId, String canal) {
        eventoService.buscarVisivel(eventoId);
        return informeRepository.listar(eventoId, canal).stream().map(InformeDTO::from).toList();
    }

    @Transactional(readOnly = true)
    public InformeDTO detalhar(UUID eventoId, UUID informeId) {
        eventoService.buscarVisivel(eventoId);
        InformeCampo i = informeRepository.findById(informeId)
                .orElseThrow(() -> new NotFoundException("Informe não encontrado"));
        return InformeDTO.from(i);
    }
}
