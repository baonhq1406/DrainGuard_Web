'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem, EnvironmentItem } from '@/types';

export type MapStyleKey = 'voyager' | 'satellite' | 'dark' | 'positron';

export const STYLE_URLS: Record<MapStyleKey, string> = {
  voyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  satellite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // uses voyager as base with ESRI imagery overlay
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
  mapStyle = 'voyager',
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
  const currentBaseStyle = useRef<MapStyleKey>('voyager');

  // Update environment map
  useEffect(() => {
    environmentCache.current = new Map(
      environment.map(x => [x.latitude.toFixed(5) + ',' + x.longitude.toFixed(5), x])
    );
  }, [environment]);

  // Setup ESRI Satellite layers on top of base vector map
  function ensureSatelliteLayers(map: any, isVisible: boolean) {
    try {
      if (!map.getSource('esri-satellite')) {
        map.addSource('esri-satellite', {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: '© Esri, Maxar, Earthstar Geographics',
        });
      }
      if (!map.getSource('esri-labels')) {
        map.addSource('esri-labels', {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
        });
      }

      if (!map.getLayer('esri-satellite-layer')) {
        map.addLayer({
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          layout: { visibility: isVisible ? 'visible' : 'none' },
        });
      } else {
        map.setLayoutProperty('esri-satellite-layer', 'visibility', isVisible ? 'visible' : 'none');
      }

      if (!map.getLayer('esri-labels-layer')) {
        map.addLayer({
          id: 'esri-labels-layer',
          type: 'raster',
          source: 'esri-labels',
          layout: { visibility: isVisible ? 'visible' : 'none' },
        });
      } else {
        map.setLayoutProperty('esri-labels-layer', 'visibility', isVisible ? 'visible' : 'none');
      }
    } catch {
      // Ignored if map is in transient state
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
              0.06,
              35,
              0.1,
              60,
              0.15,
              80,
              0.2,
              100,
              0.28,
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
            'line-width': 1.8,
            'line-opacity': 0.65,
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

  // Initialize Map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;

      const initialStyleUrl = STYLE_URLS[mapStyle === 'satellite' ? 'voyager' : mapStyle];
      currentBaseStyle.current = mapStyle === 'satellite' ? 'voyager' : mapStyle;

      const map = new lib.Map({
        container: host.current,
        style: initialStyleUrl,
        center: [108.2, 16.05],
        zoom: 12.5,
        pitch: is3D ? 50 : 0,
        bearing: 0,
        attributionControl: { compact: true },
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

        ensureSatelliteLayers(map, mapStyle === 'satellite');
        renderLayersAndMarkers(lib, map);
      });
    })();

    return () => {
      cancelled = true;
      mapLoaded.current = false;
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Map Style switching
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    const map = mapInstance.current;

    if (mapStyle === 'satellite') {
      ensureSatelliteLayers(map, true);
    } else {
      ensureSatelliteLayers(map, false);

      // If switching vector styles (e.g. voyager <-> dark <-> positron)
      if (currentBaseStyle.current !== mapStyle) {
        currentBaseStyle.current = mapStyle;
        const newStyleUrl = STYLE_URLS[mapStyle];
        map.setStyle(newStyleUrl);

        map.once('style.load', () => {
          import('maplibre-gl').then(lib => {
            ensureSatelliteLayers(map, false);
            renderLayersAndMarkers(lib, map);
          });
        });
      }
    }
  }, [mapStyle]); // eslint-disable-line react-hooks/exhaustive-deps

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
      zoom: flyToLocation.zoom || 17.5,
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
