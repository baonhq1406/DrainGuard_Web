'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem } from '@/types';

const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
const statusRank: Record<string, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4, MODEL_LIMITED: 0, NO_DRAIN: 0 };

function esc(value: string | number | null | undefined) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]!));
}

function locationKey(record: RecordItem) {
  return `${record.latitude!.toFixed(5)},${record.longitude!.toFixed(5)}`;
}

function popupHtml(records: RecordItem[], address?: string) {
  const first = records[0];
  const latest = [...records].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  const worst = records.reduce((a, b) => (statusRank[b.status] || 0) > (statusRank[a.status] || 0) ? b : a, records[0]);
  const rows = records.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8).map(r =>
    `<div style="padding:7px 0;border-top:1px solid #e5e7eb"><b>#${esc(r.id)}</b> · ${esc(r.status)}<br/>${esc(r.blockage_percent == null ? 'Blockage: —' : `Blockage: ${r.blockage_percent}%`)} · Drain: ${esc(r.drain_count)}<br/><span style="color:#64748b">${esc(new Date(r.created_at).toLocaleString('vi-VN'))}</span></div>`
  ).join('');
  return `<div style="min-width:270px;max-width:320px;font:13px/1.45 system-ui,sans-serif">
    <div style="font-size:16px;font-weight:700;margin-bottom:4px">DrainGuard · ${records.length} lượt</div>
    <div>Trạng thái gần nhất: <b>${esc(latest.status)}</b></div>
    <div>Mức cao nhất ghi nhận: <b>${esc(worst.status)}</b></div>
    <div>Tọa độ: ${esc(first.latitude?.toFixed(6))}, ${esc(first.longitude?.toFixed(6))}</div>
    <div style="margin-top:4px;color:#475569"><b>Địa chỉ:</b> <span class="dg-address">${esc(address || 'Chưa tra cứu')}</span></div>
    <button type="button" data-dg-geocode="1" style="margin-top:8px;padding:6px 9px;border:1px solid #94a3b8;border-radius:7px;background:#fff;cursor:pointer">Tra cứu địa chỉ</button>
    <div style="margin-top:8px">${rows}</div>
  </div>`;
}

export function AnalysisMap({ records }: { records: RecordItem[] }) {
  const host = useRef<HTMLDivElement>(null);
  const addressCache = useRef(new Map<string, string>());

  useEffect(() => {
    let map: any;
    let cancelled = false;

    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;

      const grouped = new Map<string, RecordItem[]>();
      for (const record of records) {
        if (record.latitude == null || record.longitude == null) continue;
        const key = locationKey(record);
        grouped.set(key, [...(grouped.get(key) || []), record]);
      }
      const points = [...grouped.values()].map(group => group[0]);

      map = new lib.Map({ container: host.current, style: STYLE_URL, center: [108.2, 16.05], zoom: 12, attributionControl: true });
      map.addControl(new lib.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new lib.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        if (!points.length) return;
        const bounds = new lib.LngLatBounds();
        for (const point of points) bounds.extend([point.longitude!, point.latitude!]);
        if (points.length === 1) map.flyTo({ center: [points[0].longitude!, points[0].latitude!], zoom: 17 });
        else map.fitBounds(bounds, { padding: 70, maxZoom: 16, duration: 600 });

        for (const [key, group] of grouped) {
          const address = addressCache.current.get(key);
          const worst = group.reduce((a, b) => (statusRank[b.status] || 0) > (statusRank[a.status] || 0) ? b : a, group[0]);
          const color = worst.status === 'CRITICAL' ? '#b5221d' : worst.status === 'HIGH' ? '#ef7c00' : worst.status === 'MODERATE' ? '#b08a00' : '#0879c9';
          const marker = new lib.Marker({ color }).setLngLat([group[0].longitude!, group[0].latitude!]).setPopup(new lib.Popup({ maxWidth: '340px' }).setHTML(popupHtml(group, address))).addTo(map);
          marker.getElement().setAttribute('title', `${group.length} lượt phân tích`);
          marker.getPopup().on('open', () => {
            const popupNode = marker.getPopup().getElement();
            const button = popupNode?.querySelector('[data-dg-geocode="1"]') as HTMLButtonElement | null;
            if (!button) return;
            button.onclick = async () => {
              button.disabled = true; button.textContent = 'Đang tra cứu...';
              const addressNode = popupNode.querySelector('.dg-address');
              try {
                let label = addressCache.current.get(key);
                if (!label) {
                  const point = group[0];
                  const url = new URL('https://nominatim.openstreetmap.org/reverse');
                  url.searchParams.set('format', 'jsonv2'); url.searchParams.set('lat', String(point.latitude)); url.searchParams.set('lon', String(point.longitude)); url.searchParams.set('zoom', '18'); url.searchParams.set('addressdetails', '1');
                  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
                  if (!response.ok) throw new Error('Không thể tra cứu địa chỉ.');
                  const data = await response.json();
                  label = data.display_name || 'Không tìm thấy địa chỉ.';
                  addressCache.current.set(key, label);
                }
                if (addressNode) addressNode.textContent = label;
                button.textContent = 'Đã tra cứu';
              } catch {
                if (addressNode) addressNode.textContent = 'Không tra cứu được.';
                button.disabled = false; button.textContent = 'Thử lại';
              }
            };
          });
        }
      });
    })();

    return () => { cancelled = true; map?.remove(); };
  }, [records]);

  return <div ref={host} style={{ height: 560, borderRadius: 12, overflow: 'hidden', border: '1px solid #d9e6ef' }} />;
}