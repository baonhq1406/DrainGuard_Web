'use client';

import { useEffect, useRef, useState } from 'react';
import { getStyleDefinition, type MapStyleKey } from './analysis-map';

export interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  height?: string;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  height = '340px',
}: LocationPickerMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [styleKey, setStyleKey] = useState<MapStyleKey>('satellite');
  const lastFlyCoord = useRef<{ lat: number; lng: number }>({ lat: latitude, lng: longitude });

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !hostRef.current) return;

      const map = new lib.Map({
        container: hostRef.current,
        style: getStyleDefinition(styleKey),
        center: [longitude, latitude],
        zoom: 16.5,
        minZoom: 4,
        maxZoom: 20,
        attributionControl: false,
        pixelRatio: typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 2) : 2,
      });

      mapRef.current = map;

      // Create draggable glowing target pin
      const el = document.createElement('div');
      el.style.cssText = `
        width: 38px;
        height: 38px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(0, 242, 254, 0.35) 0%, rgba(2, 6, 23, 0.9) 70%);
        border: 2px solid #00f2fe;
        box-shadow: 0 0 22px rgba(0, 242, 254, 0.85), inset 0 0 10px rgba(0, 242, 254, 0.5);
        display: grid;
        place-items: center;
        cursor: grab;
        position: relative;
      `;
      el.innerHTML = `
        <div style="width:12px;height:12px;border-radius:999px;background:#00f2fe;box-shadow:0 0 12px #00f2fe;"></div>
      `;

      const marker = new lib.Marker({ element: el, draggable: true, anchor: 'center' })
        .setLngLat([longitude, latitude])
        .addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        const nextLat = Number(pos.lat.toFixed(6));
        const nextLng = Number(pos.lng.toFixed(6));
        lastFlyCoord.current = { lat: nextLat, lng: nextLng };
        onChangeRef.current(nextLat, nextLng);
      });

      markerRef.current = marker;

      map.on('click', (e: any) => {
        const nextLat = Number(e.lngLat.lat.toFixed(6));
        const nextLng = Number(e.lngLat.lng.toFixed(6));
        marker.setLngLat([nextLng, nextLat]);
        lastFlyCoord.current = { lat: nextLat, lng: nextLng };
        onChangeRef.current(nextLat, nextLng);
      });

      map.on('load', () => {
        if (cancelled) return;
        map.resize();
        setTimeout(() => map.resize(), 120);
      });

      if (hostRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          if (!cancelled && mapRef.current) {
            mapRef.current.resize();
          }
        });
        resizeObserver.observe(hostRef.current);
      }
    })();

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update marker & fly when coordinates change externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    markerRef.current.setLngLat([longitude, latitude]);
    const dist =
      Math.abs(lastFlyCoord.current.lat - latitude) +
      Math.abs(lastFlyCoord.current.lng - longitude);
    if (dist > 0.00005) {
      lastFlyCoord.current = { lat: latitude, lng: longitude };
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: Math.max(mapRef.current.getZoom(), 16),
        duration: 900,
      });
    }
  }, [latitude, longitude]);

  // Switch map style
  function changeStyle(next: MapStyleKey) {
    setStyleKey(next);
    if (mapRef.current) {
      mapRef.current.setStyle(getStyleDefinition(next));
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        background: '#020617',
      }}
    >
      <div ref={hostRef} style={{ width: '100%', height: '100%', cursor: 'crosshair' }} />

      {/* Style Switcher Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          display: 'flex',
          gap: '6px',
          zIndex: 5,
          background: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {(
          [
            ['satellite', '🛰️ Vệ tinh'],
            ['modern-liberty', '🏙️ Đô thị'],
            ['modern-dark', '🌙 Đêm'],
          ] as [MapStyleKey, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => changeStyle(k)}
            style={{
              padding: '4px 10px',
              borderRadius: '7px',
              fontSize: '11.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              background: styleKey === k ? 'rgba(0, 242, 254, 0.22)' : 'transparent',
              color: styleKey === k ? '#00f2fe' : '#94a3b8',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Instruction Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: 'rgba(2, 6, 23, 0.86)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 242, 254, 0.25)',
          fontSize: '11.5px',
          color: '#e2e8f0',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <span>🎯 Nhấp vào bản đồ hoặc kéo tâm ngắm để đặt vị trí cống</span>
        <b style={{ color: '#00f2fe', fontFamily: 'monospace' }}>
          {latitude.toFixed(5)}°N, {longitude.toFixed(5)}°E
        </b>
      </div>
    </div>
  );
}
