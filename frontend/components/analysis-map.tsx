'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem, EnvironmentItem } from '@/types';

export type MapStyleKey = 'google-clean' | 'google-hybrid' | 'esri-imagery' | 'carto-dark';

export interface MapStyleOption {
  key: MapStyleKey;
  name: string;
  description: string;
  icon: string;
}

export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    key: 'google-clean',
    name: 'Đô thị GIS (Không quán ăn)',
    description: 'Tên đường mới nhất 2026, ẩn toàn bộ quán xá & cửa hàng thương mại',
    icon: '🗺️',
  },
  {
    key: 'google-hybrid',
    name: 'Vệ tinh Google (Sạch)',
    description: 'Ảnh vệ tinh thực tế độ nét cao, chỉ hiện đường & sông ngòi',
    icon: '🛰️',
  },
  {
    key: 'esri-imagery',
    name: 'Vệ tinh ArcGIS (ESRI)',
    description: 'Chuẩn khí tượng & GIS quốc tế, không có quảng cáo',
    icon: '🌍',
  },
  {
    key: 'carto-dark',
    name: 'Chế độ Đêm Dark GIS',
    description: 'Nền tối chuyên nghiệp cho phòng điều hành thông minh',
    icon: '🌙',
  },
];

// High-DPI Retina @2x Tile Sources without commercial POI clutter
// apistyle=s.t:3|p.v:off hides ALL Points of Interest (quán ăn, nhà hàng, cafe, shop, khách sạn)
// apistyle=s.t:4|p.v:off hides transit clutter
const MAP_SOURCES: Record<string, any> = {
  'google-clean': {
    type: 'raster',
    tiles: [
      'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off|s.t:4|p.v:off',
      'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off|s.t:4|p.v:off',
      'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off|s.t:4|p.v:off',
      'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off|s.t:4|p.v:off',
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 19,
    attribution: '© Google Maps (GIS Mode)',
  },
  'google-hybrid': {
    type: 'raster',
    tiles: [
      'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off',
      'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off',
      'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off',
      'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&hl=vi&scale=2&apistyle=s.t:3|p.v:off',
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 19,
    attribution: '© Google Maps',
  },
  'esri-imagery': {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 19,
    attribution: '© Esri, Maxar, Earthstar Geographics',
  },
  'esri-labels': {
    type: 'raster',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 19,
  },
  'carto-dark': {
    type: 'raster',
    tiles: [
      'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png',
    ],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 19,
    attribution: '© CARTO, © OpenStreetMap',
  },
};

const BASE_STYLE = {
  version: 8 as const,
  sources: MAP_SOURCES,
  layers: [
    {
      id: 'map-fallback-background',
      type: 'background' as const,
      paint: {
        'background-color': '#eef2f5',
      },
    },
    {
      id: 'layer-google-clean',
      type: 'raster' as const,
      source: 'google-clean',
      layout: { visibility: 'visible' as const },
      paint: {
        'raster-fade-duration': 0,
        'raster-resampling': 'linear' as const,
      },
    },
    {
      id: 'layer-google-hybrid',
      type: 'raster' as const,
      source: 'google-hybrid',
      layout: { visibility: 'none' as const },
      paint: {
        'raster-fade-duration': 0,
        'raster-resampling': 'linear' as const,
      },
    },
    {
      id: 'layer-esri-imagery',
      type: 'raster' as const,
      source: 'esri-imagery',
      layout: { visibility: 'none' as const },
      paint: {
        'raster-fade-duration': 0,
        'raster-resampling': 'linear' as const,
      },
    },
    {
      id: 'layer-esri-labels',
      type: 'raster' as const,
      source: 'esri-labels',
      layout: { visibility: 'none' as const },
      paint: {
        'raster-fade-duration': 0,
        'raster-resampling': 'linear' as const,
      },
    },
    {
      id: 'layer-carto-dark',
      type: 'raster' as const,
      source: 'carto-dark',
      layout: { visibility: 'none' as const },
      paint: {
        'raster-fade-duration': 0,
        'raster-resampling': 'linear' as const,
      },
    },
  ],
};

const statusRank: Record<string, number> = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4,
  MODEL_LIMITED: 0,
  NO_DRAIN: 0,
};

export const statusColor: Record<string, string> = {
  LOW: '#16a34a',
  MODERATE: '#ca8a04',
  HIGH: '#ea580c',
  CRITICAL: '#dc2626',
  MODEL_LIMITED: '#64748b',
  NO_DRAIN: '#64748b',
};

export const statusLabel: Record<string, string> = {
  LOW: 'Thông thoáng',
  MODERATE: 'Có nguy cơ',
  HIGH: 'Cảnh báo',
  CRITICAL: 'Nguy hiểm',
  MODEL_LIMITED: 'Chưa đủ dữ liệu AI',
  NO_DRAIN: 'Không nhận diện được drain',
};

function locationKey(record: RecordItem) {
  return record.latitude!.toFixed(5) + ',' + record.longitude!.toFixed(5);
}

function worstRecord(records: RecordItem[]) {
  return records.reduce((a, b) => ((statusRank[b.status] || 0) > (statusRank[a.status] || 0) ? b : a), records[0]);
}

function riskCircleFeature(lon: number, lat: number, radiusMeters: number, level: string, score: number | null) {
  const points: number[][] = [];
  const latFactor = 111320;
  const lonFactor = 111320 * Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    points.push([
      lon + (Math.cos(angle) * radiusMeters) / lonFactor,
      lat + (Math.sin(angle) * radiusMeters) / latFactor,
    ]);
  }
  return {
    type: 'Feature' as const,
    properties: { level, score },
    geometry: { type: 'Polygon' as const, coordinates: [points] },
  };
}

function drainMarkerElement(level: string, isSelected: boolean = false) {
  const el = document.createElement('div');
  el.className = `drain-marker ${isSelected ? 'is-selected' : ''} ${
    level === 'CRITICAL' || level === 'HIGH' ? 'has-pulse' : ''
  }`;
  const color = statusColor[level] || '#64748b';
  el.innerHTML = `
    <div class="drain-marker-pin" style="--marker-color: ${color}">
      ${level === 'CRITICAL' || level === 'HIGH' ? '<span class="drain-marker-pulse"></span>' : ''}
      <div class="drain-marker-core">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M8 12h8M12 8v8"/>
        </svg>
      </div>
    </div>
  `;
  return el;
}

export interface AnalysisMapProps {
  records: RecordItem[];
  environment?: EnvironmentItem[];
  selectedLocationKey?: string | null;
  onSelectRecord?: (record: RecordItem, group: RecordItem[], env?: EnvironmentItem) => void;
  mapStyle?: MapStyleKey;
  showRiskZones?: boolean;
  is3D?: boolean;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  fitBoundsSignal?: number;
  onBearingChange?: (bearing: number) => void;
  onMapReady?: (map: any) => void;
}

export function AnalysisMap({
  records,
  environment = [],
  selectedLocationKey = null,
  onSelectRecord,
  mapStyle = 'google-clean',
  showRiskZones = true,
  is3D = false,
  flyToLocation = null,
  userLocation = null,
  fitBoundsSignal = 0,
  onBearingChange,
  onMapReady,
}: AnalysisMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const mapLoaded = useRef(false);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const environmentCache = useRef<Map<string, EnvironmentItem>>(new Map());

  // Update environment map
  useEffect(() => {
    environmentCache.current = new Map(
      environment.map(x => [x.latitude.toFixed(5) + ',' + x.longitude.toFixed(5), x])
    );
  }, [environment]);

  // Update visible raster layer based on mapStyle
  function applyMapStyle(map: any, styleKey: MapStyleKey) {
    const isGoogleClean = styleKey === 'google-clean';
    const isGoogleHybrid = styleKey === 'google-hybrid';
    const isEsri = styleKey === 'esri-imagery';
    const isCartoDark = styleKey === 'carto-dark';

    if (map.getLayer('layer-google-clean')) {
      map.setLayoutProperty('layer-google-clean', 'visibility', isGoogleClean ? 'visible' : 'none');
    }
    if (map.getLayer('layer-google-hybrid')) {
      map.setLayoutProperty('layer-google-hybrid', 'visibility', isGoogleHybrid ? 'visible' : 'none');
    }
    if (map.getLayer('layer-esri-imagery')) {
      map.setLayoutProperty('layer-esri-imagery', 'visibility', isEsri ? 'visible' : 'none');
    }
    if (map.getLayer('layer-esri-labels')) {
      map.setLayoutProperty('layer-esri-labels', 'visibility', isEsri ? 'visible' : 'none');
    }
    if (map.getLayer('layer-carto-dark')) {
      map.setLayoutProperty('layer-carto-dark', 'visibility', isCartoDark ? 'visible' : 'none');
    }
  }

  // Render Risk Zones & Markers
  function renderLayersAndMarkers(lib: any, map: any) {
    if (!map || !map.isStyleLoaded()) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Group records by location
    const grouped = new Map<string, RecordItem[]>();
    for (const record of records) {
      if (record.latitude == null || record.longitude == null) continue;
      const key = locationKey(record);
      grouped.set(key, [...(grouped.get(key) || []), record]);
    }
    const groups = [...grouped.values()];

    const zoneFeatures = groups.map(group => {
      const worst = worstRecord(group);
      const env = environmentCache.current.get(locationKey(group[0]));
      const radius = Math.max(45, Math.min(240, 45 + (env?.flood_risk_score || 0) * 1.8));
      return riskCircleFeature(
        group[0].longitude!,
        group[0].latitude!,
        radius,
        env?.flood_risk_level || worst.status,
        env?.flood_risk_score ?? null
      );
    });

    try {
      if (map.getSource('drainguard-zones')) {
        map.getSource('drainguard-zones').setData({ type: 'FeatureCollection', features: zoneFeatures });
      } else {
        map.addSource('drainguard-zones', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: zoneFeatures },
        });

        map.addLayer({
          id: 'drainguard-zone-fill',
          type: 'fill',
          source: 'drainguard-zones',
          layout: { visibility: showRiskZones ? 'visible' : 'none' },
          paint: {
            'fill-color': [
              'match',
              ['get', 'level'],
              'CRITICAL',
              '#dc2626',
              'HIGH',
              '#ea580c',
              'MODERATE',
              '#ca8a04',
              'LOW',
              '#16a34a',
              '#64748b',
            ],
            'fill-opacity': [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'score'], 0],
              0,
              0.08,
              35,
              0.14,
              60,
              0.2,
              80,
              0.26,
              100,
              0.34,
            ],
          },
        });

        map.addLayer({
          id: 'drainguard-zone-line',
          type: 'line',
          source: 'drainguard-zones',
          layout: { visibility: showRiskZones ? 'visible' : 'none' },
          paint: {
            'line-color': [
              'match',
              ['get', 'level'],
              'CRITICAL',
              '#dc2626',
              'HIGH',
              '#ea580c',
              'MODERATE',
              '#ca8a04',
              'LOW',
              '#16a34a',
              '#64748b',
            ],
            'line-width': 2,
            'line-opacity': 0.75,
            'line-dasharray': [3, 2],
          },
        });
      }
    } catch {
      // Ignored
    }

    // Render Markers
    for (const [key, group] of grouped) {
      const worst = worstRecord(group);
      const latest = [...group].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      const isSelected = selectedLocationKey === key;
      const env = environmentCache.current.get(key);

      const markerEl = drainMarkerElement(worst.status, isSelected);
      markerEl.setAttribute('title', `Miệng thu: ${statusLabel[worst.status] || worst.status}`);

      markerEl.addEventListener('click', e => {
        e.stopPropagation();
        if (onSelectRecord) {
          onSelectRecord(latest, group, env);
        }
      });

      const marker = new lib.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([group[0].longitude!, group[0].latitude!])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }

  // Initialize Map with Google Maps Retina 2X base style
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;

      // Force pixelRatio to at least 2 for crisp Retina rendering on all screens
      const targetPixelRatio =
        typeof window !== 'undefined'
          ? Math.max(window.devicePixelRatio || 1, 2)
          : 2;

      const map = new lib.Map({
        container: host.current,
        style: BASE_STYLE,
        center: [108.2, 16.05],
        zoom: 13,
        minZoom: 3,
        maxZoom: 19.5, // Giới hạn tối đa 5m theo chuẩn Google Maps, chống đen màn hình
        pitch: is3D ? 50 : 0,
        bearing: 0,
        attributionControl: { compact: true },
        pixelRatio: targetPixelRatio,
        fadeDuration: 0, // Eliminate fade blur during zoom transitions
      });

      map.addControl(new lib.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

      map.on('rotate', () => {
        if (onBearingChange) onBearingChange(map.getBearing());
      });

      map.on('load', () => {
        if (cancelled) return;
        mapLoaded.current = true;
        mapInstance.current = map;
        if (onMapReady) onMapReady(map);

        // Immediate and post-mount resize to ensure 100% canvas buffer alignment
        map.resize();
        setTimeout(() => map.resize(), 120);

        applyMapStyle(map, mapStyle);
        renderLayersAndMarkers(lib, map);
      });

      // Keep WebGL buffer size perfectly synchronized with container dimensions
      if (host.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (!cancelled && mapInstance.current) {
            mapInstance.current.resize();
          }
        });
        resizeObserver.observe(host.current);
      }
    })();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      mapLoaded.current = false;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Map Style switching with zero-latency layer visibility
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    applyMapStyle(mapInstance.current, mapStyle);
  }, [mapStyle]);

  // Re-render markers and risk zones when records change
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    import('maplibre-gl').then(lib => {
      renderLayersAndMarkers(lib, mapInstance.current);
    });
  }, [records, selectedLocationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle risk zones toggle
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    const map = mapInstance.current;
    const vis = showRiskZones ? 'visible' : 'none';
    if (map.getLayer('drainguard-zone-fill')) {
      map.setLayoutProperty('drainguard-zone-fill', 'visibility', vis);
    }
    if (map.getLayer('drainguard-zone-line')) {
      map.setLayoutProperty('drainguard-zone-line', 'visibility', vis);
    }
  }, [showRiskZones]);

  // Handle 3D Tilt
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    mapInstance.current.easeTo({
      pitch: is3D ? 50 : 0,
      duration: 600,
    });
  }, [is3D]);

  // Handle flyToLocation
  useEffect(() => {
    if (!mapInstance.current || !flyToLocation) return;
    mapInstance.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: Math.min(18.5, flyToLocation.zoom || 17.5),
      pitch: is3D ? 50 : 30,
      duration: 800,
      essential: true,
    });
  }, [flyToLocation, is3D]);

  // Handle fit bounds signal
  useEffect(() => {
    if (!mapInstance.current || !records.length || fitBoundsSignal === 0) return;
    import('maplibre-gl').then(lib => {
      const bounds = new lib.LngLatBounds();
      let hasValid = false;
      records.forEach(r => {
        if (r.latitude != null && r.longitude != null) {
          bounds.extend([r.longitude, r.latitude]);
          hasValid = true;
        }
      });
      if (hasValid) {
        mapInstance.current.fitBounds(bounds, {
          padding: { top: 90, bottom: 90, left: 400, right: 90 },
          maxZoom: 16,
          duration: 900,
        });
      }
    });
  }, [fitBoundsSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle User GPS Location marker
  useEffect(() => {
    if (!mapInstance.current || !userLocation) return;
    import('maplibre-gl').then(lib => {
      if (userMarkerRef.current) userMarkerRef.current.remove();
      const el = document.createElement('div');
      el.className = 'user-gps-marker';
      el.innerHTML = '<span class="user-gps-pulse"></span><span class="user-gps-dot"></span>';
      userMarkerRef.current = new lib.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(mapInstance.current);
    });
  }, [userLocation]);

  return <div ref={host} className="analysis-map-canvas" />;
}
