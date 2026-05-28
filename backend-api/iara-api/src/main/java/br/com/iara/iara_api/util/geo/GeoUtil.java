package br.com.iara.iara_api.util.geo;

import br.com.iara.iara_api.dto.common.CoordenadasDTO;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.LinearRing;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Polygon;
import org.locationtech.jts.geom.PrecisionModel;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Conversões entre os DTOs da API e os tipos JTS persistidos pelo Hibernate Spatial.
 * SRID 4326 (WGS84) em todas as geometrias — coerente com as colunas GEOMETRY do DDL.
 */
public final class GeoUtil {

    public static final int SRID = 4326;
    private static final GeometryFactory FACTORY =
            new GeometryFactory(new PrecisionModel(), SRID);

    private GeoUtil() {
    }

    public static GeometryFactory factory() {
        return FACTORY;
    }

    /** Cria um Point JTS. Atenção: JTS usa (x=lng, y=lat). */
    public static Point point(double lat, double lng) {
        Point p = FACTORY.createPoint(new Coordinate(lng, lat));
        p.setSRID(SRID);
        return p;
    }

    public static Point point(CoordenadasDTO c) {
        if (c == null) {
            return null;
        }
        return point(c.lat(), c.lng());
    }

    public static CoordenadasDTO toCoordenadas(Point p) {
        if (p == null) {
            return null;
        }
        return new CoordenadasDTO(p.getY(), p.getX());
    }

    /**
     * Converte um GeoJSON Polygon ({"type":"Polygon","coordinates":[[[lng,lat],...]]})
     * em uma geometria JTS. Aceita também GeoJSON Point.
     */
    @SuppressWarnings("unchecked")
    public static Geometry fromGeoJson(Map<String, Object> geoJson) {
        if (geoJson == null) {
            return null;
        }
        String type = (String) geoJson.get("type");
        List<Object> coords = (List<Object>) geoJson.get("coordinates");
        if (type == null || coords == null) {
            throw new IllegalArgumentException("GeoJSON inválido: 'type' e 'coordinates' são obrigatórios");
        }
        return switch (type) {
            case "Point" -> {
                double lng = ((Number) coords.get(0)).doubleValue();
                double lat = ((Number) coords.get(1)).doubleValue();
                yield point(lat, lng);
            }
            case "Polygon" -> polygon((List<Object>) (Object) coords);
            default -> throw new IllegalArgumentException("Tipo GeoJSON não suportado: " + type);
        };
    }

    @SuppressWarnings("unchecked")
    private static Polygon polygon(List<Object> rings) {
        if (rings.isEmpty()) {
            throw new IllegalArgumentException("Polygon sem anéis");
        }
        List<Object> outer = (List<Object>) rings.get(0);
        LinearRing shell = ring(outer);
        LinearRing[] holes = new LinearRing[rings.size() - 1];
        for (int i = 1; i < rings.size(); i++) {
            holes[i - 1] = ring((List<Object>) rings.get(i));
        }
        Polygon poly = FACTORY.createPolygon(shell, holes);
        poly.setSRID(SRID);
        return poly;
    }

    @SuppressWarnings("unchecked")
    private static LinearRing ring(List<Object> positions) {
        Coordinate[] coords = new Coordinate[positions.size()];
        for (int i = 0; i < positions.size(); i++) {
            List<Object> pos = (List<Object>) positions.get(i);
            double lng = ((Number) pos.get(0)).doubleValue();
            double lat = ((Number) pos.get(1)).doubleValue();
            coords[i] = new Coordinate(lng, lat);
        }
        return FACTORY.createLinearRing(coords);
    }

    /** Serializa uma geometria JTS como GeoJSON (Point ou Polygon). */
    public static Map<String, Object> toGeoJson(Geometry g) {
        if (g == null) {
            return null;
        }
        if (g instanceof Point p) {
            return Map.of("type", "Point", "coordinates", List.of(p.getX(), p.getY()));
        }
        if (g instanceof Polygon poly) {
            List<Object> rings = new ArrayList<>();
            rings.add(ringToList(poly.getExteriorRing().getCoordinates()));
            for (int i = 0; i < poly.getNumInteriorRing(); i++) {
                rings.add(ringToList(poly.getInteriorRingN(i).getCoordinates()));
            }
            return Map.of("type", "Polygon", "coordinates", rings);
        }
        throw new IllegalArgumentException("Geometria não suportada para GeoJSON: " + g.getGeometryType());
    }

    private static List<Object> ringToList(Coordinate[] coords) {
        List<Object> ring = new ArrayList<>(coords.length);
        for (Coordinate c : coords) {
            ring.add(List.of(c.x, c.y));
        }
        return ring;
    }
}
