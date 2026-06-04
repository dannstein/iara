package br.com.iara.iara_api.controller;

import br.com.iara.iara_api.dto.admin.AppConfigDTO;
import br.com.iara.iara_api.dto.admin.UpdateAppConfigRequest;
import br.com.iara.iara_api.service.AppConfigService;
import br.com.iara.iara_api.service.channel.INotificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/admin/app-config")
@RequiredArgsConstructor
public class AppConfigController {

    private final AppConfigService service;
    private final List<INotificationChannel> channels;

    /** GET — qualquer auth pode ver o estado (ex.: para mostrar banner). */
    @GetMapping
    public AppConfigDTO get() {
        return build();
    }

    /** PUT — ADMIN apenas. Apenas as chaves enviadas são alteradas. */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AppConfigDTO update(@RequestBody UpdateAppConfigRequest req) {
        if (req.disasterModeAtivo() != null) {
            service.set(AppConfigService.K_DISASTER_MODE, String.valueOf(req.disasterModeAtivo()));
        }
        if (req.canaisHabilitados() != null) {
            service.set(AppConfigService.K_CANAIS, String.join(",", req.canaisHabilitados()));
        }
        return build();
    }

    private AppConfigDTO build() {
        Map<String, String> snapshot = service.snapshot();
        Set<String> known = Set.of(AppConfigService.K_DISASTER_MODE, AppConfigService.K_CANAIS);
        Map<String, String> outros = new HashMap<>();
        snapshot.forEach((k, v) -> {
            if (!known.contains(k)) outros.put(k, v);
        });
        List<AppConfigDTO.ChannelStatus> chs = channels.stream()
                .map(c -> new AppConfigDTO.ChannelStatus(c.id(), c.isHealthy()))
                .toList();
        return new AppConfigDTO(
                service.isDisasterMode(),
                service.canaisHabilitados(),
                chs,
                outros
        );
    }
}
