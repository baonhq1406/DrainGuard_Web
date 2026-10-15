'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem, EnvironmentItem } from '@/types';

export type MapStyleKey = 'modern-light' | 'modern-liberty' | 'satellite' | 'modern-dark';

export interface MapStyleOption {
  key: MapStyleKey;
  name: string;
  description: string;
  icon: string;
}

export const MAP_STYLE_OPTIONS: MapStyleOption[] = [
  {
    key: 'modern-liberty',
    name: 'Đô thị Sinh động',
    description: 'Vector đa sắc màu, công viên & sông hồ sắc nét, chuẩn Google/Apple Maps',
    icon: '🏙️',
  },
  {
    key: 'satellite',
    name: 'Vệ tinh Thực địa',
    description: 'Ảnh vệ tinh quang học mới nhất, sắc nét từng mét & 100% sạch rác',
    icon: '🛰️',
  },
  {
    key: 'modern-dark',
    name: 'Chế độ Đêm',
    description: 'Giao diện tối công nghệ cao cho trung tâm giám sát & điều hành',
    icon: '🌙',
  },
  {
    key: 'modern-light',
    name: 'Đô thị Tối giản',
    description: 'Vector tối giản đơn sắc, tinh gọn & chuẩn GIS',
    icon: '💎',
  },
];

// High-resolution Clean Satellite Style (Pure Optical Satellite + Clean Street Labels)
const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    'satellite-optical': {
      type: 'raster',
      tiles: [
        'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: '© Google Satellite Imagery',
    },
    'satellite-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'satellite-base',
      type: 'raster' as const,
      source: 'satellite-optical',
      paint: {
        'raster-fade-duration': 0,
      },
    },
    {
      id: 'satellite-labels',
      type: 'raster' as const,
      source: 'satellite-labels',
      paint: {
        'raster-fade-duration': 0,
      },
    },
  ],
};

export function getStyleDefinition(key: MapStyleKey): any {
  switch (key) {
    case 'modern-liberty':
      return 'https://tiles.openfreemap.org/styles/liberty';
    case 'satellite':
      return SATELLITE_STYLE;
    case 'modern-dark':
      return 'https://tiles.openfreemap.org/styles/dark';
    case 'modern-light':
      return 'https://tiles.openfreemap.org/styles/positron';
    default:
      return 'https://tiles.openfreemap.org/styles/liberty';
  }
}

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
  mapStyle = 'modern-liberty',
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
  const libRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const environmentCache = useRef<Map<string, EnvironmentItem>>(new Map());

  // Refs for persistent event handler access
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const environmentRef = useRef(environment);
  environmentRef.current = environment;
  const selectedLocationKeyRef = useRef(selectedLocationKey);
  selectedLocationKeyRef.current = selectedLocationKey;
  const showRiskZonesRef = useRef(showRiskZones);
  showRiskZonesRef.current = showRiskZones;
  const onSelectRecordRef = useRef(onSelectRecord);
  onSelectRecordRef.current = onSelectRecord;

  // Update environment map
  useEffect(() => {
    environmentCache.current = new Map(
      environment.map(x => [x.latitude.toFixed(5) + ',' + x.longitude.toFixed(5), x])
    );
  }, [environment]);

  // Render Risk Zones & Markers
  function renderLayersAndMarkers(lib: any, map: any) {
    if (!map || !map.isStyleLoaded()) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const currentRecords = recordsRef.current;
    const currentSelectedKey = selectedLocationKeyRef.current;
    const currentShowRisk = showRiskZonesRef.current;

    // Group records by location
    const grouped = new Map<string, RecordItem[]>();
    for (const record of currentRecords) {
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
          layout: { visibility: currentShowRisk ? 'visible' : 'none' },
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
          layout: { visibility: currentShowRisk ? 'visible' : 'none' },
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
      const isSelected = currentSelectedKey === key;
      const env = environmentCache.current.get(key);

      const markerEl = drainMarkerElement(worst.status, isSelected);
      markerEl.setAttribute('title', `Miệng thu: ${statusLabel[worst.status] || worst.status}`);

      markerEl.addEventListener('click', e => {
        e.stopPropagation();
        if (onSelectRecordRef.current) {
          onSelectRecordRef.current(latest, group, env);
        }
      });

      const marker = new lib.Marker({ element: markerEl, anchor: 'center' })
        .setLngLat([group[0].longitude!, group[0].latitude!])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }

  // Initialize Map with vector style
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;
      libRef.current = lib;

      // Force pixelRatio to at least 2 for crisp Retina rendering on all screens
      const targetPixelRatio =
        typeof window !== 'undefined'
          ? Math.max(window.devicePixelRatio || 1, 2)
          : 2;

      const initialStyle = getStyleDefinition(mapStyle);

      const map = new lib.Map({
        container: host.current,
        style: initialStyle,
        center: [108.2532, 15.975],
        zoom: 16,
        minZoom: 3,
        maxZoom: 20, // Vector tiles allow smooth high-detail inspection
        pitch: is3D ? 50 : 0,
        bearing: 0,
        attributionControl: { compact: true },
        pixelRatio: targetPixelRatio,
      });

      map.addControl(new lib.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

      map.on('rotate', () => {
        if (onBearingChange) onBearingChange(map.getBearing());
      });

      const onStyleLoaded = () => {
        if (cancelled) return;
        // Suppress commercial food/restaurant POI layers if present in the style
        ['poi_r20', 'poi_r7', 'poi_r1'].forEach(id => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', 'none');
          }
        });
        renderLayersAndMarkers(lib, map);
      };

      map.on('style.load', onStyleLoaded);

      map.on('load', () => {
        if (cancelled) return;
        mapLoaded.current = true;
        mapInstance.current = map;
        if (onMapReady) onMapReady(map);

        // Immediate and post-mount resize to ensure 100% canvas buffer alignment
        map.resize();
        setTimeout(() => map.resize(), 120);

        onStyleLoaded();
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

  // Handle dynamic map style switching
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    const newStyle = getStyleDefinition(mapStyle);
    mapInstance.current.setStyle(newStyle);
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
