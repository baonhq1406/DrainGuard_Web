'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem, EnvironmentItem } from '@/types';
import { files } from '@/services/api';

const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
const statusRank: Record<string, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4, MODEL_LIMITED: 0, NO_DRAIN: 0 };
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

function esc(value: string | number | null | undefined) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]!));
}

function locationKey(record: RecordItem) {
  return record.latitude!.toFixed(5) + ',' + record.longitude!.toFixed(5);
}

function worstRecord(records: RecordItem[]) {
  return records.reduce((a, b) => (statusRank[b.status] || 0) > (statusRank[a.status] || 0) ? b : a, records[0]);
}

function riskCircleFeature(lon: number, lat: number, radiusMeters: number, level: string, score: number | null) {
  const points: number[][] = [];
  const latFactor = 111320;
  const lonFactor = 111320 * Math.cos((lat * Math.PI) / 180);
  for (let i = 0; i <= 48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    points.push([lon + (Math.cos(angle) * radiusMeters) / lonFactor, lat + (Math.sin(angle) * radiusMeters) / latFactor]);
  }
  return { type: 'Feature', properties: { level, score }, geometry: { type: 'Polygon', coordinates: [points] } };
}

function drainMarkerElement(level: string, isSelected: boolean = false) {
  const el = document.createElement('div');
  el.className = `drain-marker ${isSelected ? 'is-selected' : ''} ${level === 'CRITICAL' || level === 'HIGH' ? 'has-pulse' : ''}`;
  const color = statusColor[level] || '#64748b';
  el.innerHTML = `
    <div class="drain-marker-pin" style="--marker-color: ${color}">
      ${level === 'CRITICAL' || level === 'HIGH' ? '<span class="drain-marker-pulse"></span>' : ''}
      <div class="drain-marker-core">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
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
  mapStyle?: 'street' | 'satellite';
  showRiskZones?: boolean;
  flyToLocation?: { lat: number; lng: number; zoom?: number } | null;
  userLocation?: { lat: number; lng: number } | null;
  fitBoundsSignal?: number;
}

export function AnalysisMap({
  records,
  environment = [],
  selectedLocationKey = null,
  onSelectRecord,
  mapStyle = 'street',
  showRiskZones = true,
  flyToLocation = null,
  userLocation = null,
  fitBoundsSignal = 0,
}: AnalysisMapProps) {
  const host = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const mapLoaded = useRef(false);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const environmentCache = useRef<Map<string, EnvironmentItem>>(new Map());

  // Update environment map
  useEffect(() => {
    environmentCache.current = new Map(environment.map(x => [x.latitude.toFixed(5) + ',' + x.longitude.toFixed(5), x]));
  }, [environment]);

  // Initialize Map
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;

      const map = new lib.Map({
        container: host.current,
        style: STYLE_URL,
        center: [108.2, 16.05],
        zoom: 12,
        attributionControl: { compact: true },
      });

      map.addControl(new lib.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new lib.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        if (cancelled) return;
        mapLoaded.current = true;
        mapInstance.current = map;

        // Add ESRI Satellite raster source & layer beneath zones
        try {
          map.addSource('esri-satellite', {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
          });
          map.addLayer({
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            layout: { visibility: mapStyle === 'satellite' ? 'visible' : 'none' },
          });
        } catch {
          // Ignore if already added
        }

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

  // Re-render markers and risk zones when records change
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    import('maplibre-gl').then(lib => {
      renderLayersAndMarkers(lib, mapInstance.current);
    });
  }, [records, selectedLocationKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle map style toggle (Street vs Satellite)
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded.current) return;
    const map = mapInstance.current;
    if (map.getLayer('esri-satellite-layer')) {
      map.setLayoutProperty('esri-satellite-layer', 'visibility', mapStyle === 'satellite' ? 'visible' : 'none');
    }
  }, [mapStyle]);

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

  // Handle flyToLocation
  useEffect(() => {
    if (!mapInstance.current || !flyToLocation) return;
    mapInstance.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: flyToLocation.zoom || 17,
      pitch: 35,
      duration: 800,
    });
  }, [flyToLocation]);

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
        mapInstance.current.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 800 });
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

  function renderLayersAndMarkers(lib: any, map: any) {
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const grouped = new Map<string, RecordItem[]>();
    for (const record of records) {
      if (record.latitude == null || record.longitude == null) continue;
      const key = locationKey(record);
      grouped.set(key, [...(grouped.get(key) || []), record]);
    }
    const groups = [...grouped.values()];
    const points = groups.map(g => g[0]);

    if (!points.length) {
      if (map.getSource('drainguard-zones')) {
        map.getSource('drainguard-zones').setData({ type: 'FeatureCollection', features: [] });
      }
      return;
    }

    const bounds = new lib.LngLatBounds();
    const zoneFeatures = groups.map(group => {
      const worst = worstRecord(group);
      bounds.extend([group[0].longitude!, group[0].latitude!]);
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

    if (map.getSource('drainguard-zones')) {
      map.getSource('drainguard-zones').setData({ type: 'FeatureCollection', features: zoneFeatures });
    } else {
      map.addSource('drainguard-zones', { type: 'geojson', data: { type: 'FeatureCollection', features: zoneFeatures } });
      map.addLayer({
        id: 'drainguard-zone-fill',
        type: 'fill',
        source: 'drainguard-zones',
        layout: { visibility: showRiskZones ? 'visible' : 'none' },
        paint: {
          'fill-color': ['match', ['get', 'level'], 'CRITICAL', '#dc2626', 'HIGH', '#ea580c', 'MODERATE', '#ca8a04', 'LOW', '#16a34a', '#64748b'],
          'fill-opacity': ['interpolate', ['linear'], ['coalesce', ['get', 'score'], 0], 0, 0.05, 35, 0.08, 60, 0.12, 80, 0.16, 100, 0.22],
        },
      });
      map.addLayer({
        id: 'drainguard-zone-line',
        type: 'line',
        source: 'drainguard-zones',
        layout: { visibility: showRiskZones ? 'visible' : 'none' },
        paint: {
          'line-color': ['match', ['get', 'level'], 'CRITICAL', '#dc2626', 'HIGH', '#ea580c', 'MODERATE', '#ca8a04', 'LOW', '#16a34a', '#64748b'],
          'line-width': 1.5,
          'line-opacity': 0.45,
          'line-dasharray': [3, 2],
        },
      });
    }

    // Render Markers
    for (const [key, group] of grouped) {
      const worst = worstRecord(group);
      const latest = [...group].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
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

  return <div ref={host} className="analysis-map-canvas" />;
}
