package br.com.iara.iara_api.dto.admin;

import java.util.List;
import java.util.Map;

public record AppConfigDTO(
        boolean disasterModeAtivo,
        List<String> canaisHabilitados,
        List<ChannelStatus> canaisDisponiveis,
        Map<String, String> outros
) {
    public record ChannelStatus(String id, boolean healthy) {}
}
