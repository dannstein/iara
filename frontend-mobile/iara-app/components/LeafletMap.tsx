import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '../constants/theme';
import { LEAFLET_CSS, LEAFLET_JS } from '../lib/leaflet-source';

// ── Tipos ────────────────────────────────────────────────────

export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
  title?: string;
  description?: string;
}

export interface MapCircle {
  lat: number;
  lng: number;
  radius: number;   // metros
  color: string;
}

export type GeoJsonGeometry = object;

export interface MapPolygon {
  geojson: GeoJsonGeometry;
  color: string;
}

interface LeafletMapProps {
  style?: ViewStyle;
  markers?: MapMarker[];
  circles?: MapCircle[];
  polygons?: MapPolygon[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

// ── HTML estático ─────────────────────────────────────────────
//
// Leaflet é injetado inline (sem CDN) — funciona offline e sem
// race condition entre onLoadEnd e carregamento de script externo.
//
// Dados do mapa são injetados via injectJavaScript após o load,
// evitando recarregar o Leaflet a cada mudança de marcadores.

const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <style>${LEAFLET_CSS}</style>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; background:#e2e8f0; }
    .leaflet-control-attribution { display:none; }
  </style>
</head>
<body>
<div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
  var map = L.map('map', {
    zoomControl: false,
    tap: false,
    dragging: true,
    touchZoom: true,
    doubleClickZoom: true,
    scrollWheelZoom: false
  }).setView([-23.0264, -45.5556], 11);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);

  var polygonLayer = L.layerGroup().addTo(map);
  var circleLayer  = L.layerGroup().addTo(map);
  var markerLayer  = L.layerGroup().addTo(map);

  window.updateMapData = function(markers, circles, polygons) {
    polygonLayer.clearLayers();
    circleLayer.clearLayers();
    markerLayer.clearLayers();

    polygons.forEach(function(p) {
      L.geoJSON(p.geojson, {
        style: { color:p.color, weight:1.5, fillColor:p.color, fillOpacity:0.13 }
      }).addTo(polygonLayer);
    });

    circles.forEach(function(c) {
      L.circle([c.lat, c.lng], {
        radius:c.radius, color:c.color, fillColor:c.color, fillOpacity:0.15, weight:1.5
      }).addTo(circleLayer);
    });

    markers.forEach(function(m) {
      var icon = L.divIcon({
        html: '<div style="width:14px;height:14px;border-radius:50%;background:' + m.color + ';border:2.5px solid rgba(255,255,255,0.95);box-shadow:0 1px 5px rgba(0,0,0,0.4);"></div>',
        className:'', iconSize:[14,14], iconAnchor:[7,7]
      });
      var mk = L.marker([m.lat, m.lng], {icon:icon}).addTo(markerLayer);
      if (m.title) {
        mk.bindPopup(m.description ? '<b>' + m.title + '</b><br>' + m.description : '<b>' + m.title + '</b>');
      }
    });

    var pts = markers.map(function(m){ return [m.lat, m.lng]; });
    if (pts.length === 1) {
      map.setView(pts[0], 13);
    } else if (pts.length > 1) {
      map.fitBounds(L.latLngBounds(pts).pad(0.25));
    }
  };
</script>
</body>
</html>`;

// ── Componente ───────────────────────────────────────────────

export function LeafletMap({
  style,
  markers  = [],
  circles  = [],
  polygons = [],
}: LeafletMapProps) {
  const webViewRef   = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const injectData = useCallback((m: MapMarker[], c: MapCircle[], p: MapPolygon[]) => {
    if (!webViewRef.current) return;
    const script = `
      if (window.updateMapData) {
        window.updateMapData(
          ${JSON.stringify(m)},
          ${JSON.stringify(c)},
          ${JSON.stringify(p)}
        );
      }
      true;
    `;
    webViewRef.current.injectJavaScript(script);
  }, []);

  const onLoadEnd = useCallback(() => {
    setReady(true);
    injectData(markers, circles, polygons);
  }, [markers, circles, polygons, injectData]);

  useEffect(() => {
    if (!ready) return;
    injectData(markers, circles, polygons);
  }, [ready, markers, circles, polygons, injectData]);

  return (
    <View style={[styles.container, style]}>
      {/*
        onStartShouldSetResponderCapture captura toques antes do ScrollView pai (iOS).
        nestedScrollEnabled coordena gestos com o ScrollView pai no Android.
      */}
      <View style={StyleSheet.absoluteFill} onStartShouldSetResponderCapture={() => true}>
        <WebView
          ref={webViewRef}
          source={{ html: LEAFLET_HTML }}
          style={styles.webview}
          onLoadEnd={onLoadEnd}
          bounces={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          nestedScrollEnabled={true}
          androidLayerType="hardware"
        />
      </View>

      {!ready && (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator color={Colors.blue.dark} size="large" />
        </View>
      )}
    </View>
  );
}

// ── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
});
