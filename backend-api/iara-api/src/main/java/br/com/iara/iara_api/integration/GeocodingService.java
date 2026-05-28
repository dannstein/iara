package br.com.iara.iara_api.integration;

import org.locationtech.jts.geom.Point;

/**
 * Converte endereço textual em coordenadas (RN20, RN26).
 * Implementação real (Nominatim/Google) substitui o stub via profile.
 */
public interface GeocodingService {
    Point geocode(String enderecoTxt);
}
