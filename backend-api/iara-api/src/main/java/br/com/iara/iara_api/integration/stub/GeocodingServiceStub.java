package br.com.iara.iara_api.integration.stub;

import br.com.iara.iara_api.integration.GeocodingService;
import br.com.iara.iara_api.util.geo.GeoUtil;
import org.locationtech.jts.geom.Point;
import org.springframework.stereotype.Service;

/**
 * Stub de geocoding: deriva um ponto determinístico do texto do endereço
 * (em torno de São Paulo) para permitir o fluxo completo sem API externa.
 */
@Service
public class GeocodingServiceStub implements GeocodingService {

    @Override
    public Point geocode(String enderecoTxt) {
        int h = enderecoTxt == null ? 0 : enderecoTxt.hashCode();
        double lat = -23.55 + ((h % 1000) / 100_000.0);
        double lng = -46.63 + (((h / 1000) % 1000) / 100_000.0);
        return GeoUtil.point(lat, lng);
    }
}
