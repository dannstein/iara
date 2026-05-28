package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.sync.SyncBatchRequest;
import br.com.iara.iara_api.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService service;

    @GetMapping("/pendentes")
    public Map<String, List<UUID>> pendentes() {
        return service.pendentes();
    }

    @PostMapping("/batch")
    public Map<String, Object> batch(@RequestBody SyncBatchRequest req) {
        return service.batch(req);
    }
}
