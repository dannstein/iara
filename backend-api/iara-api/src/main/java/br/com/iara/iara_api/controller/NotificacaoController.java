package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.notificacao.NotificacaoDTO;
import br.com.iara.iara_api.service.NotificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/notificacoes")
@RequiredArgsConstructor
public class NotificacaoController {

    private final NotificacaoService service;

    @GetMapping
    public List<NotificacaoDTO> listar() {
        return service.listar();
    }

    @PatchMapping("/{id}/ler")
    public NotificacaoDTO ler(@PathVariable UUID id) {
        return service.marcarLida(id);
    }

    @PatchMapping("/ler-todas")
    public Map<String, Integer> lerTodas() {
        return Map.of("atualizadas", service.marcarTodasLidas());
    }

    @GetMapping("/nao-lidas/count")
    public Map<String, Long> naoLidas() {
        return Map.of("count", service.naoLidas());
    }
}
