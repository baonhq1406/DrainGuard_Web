'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem } from '@/types';

function popupHtml(record: RecordItem) {
  const blockage = record.blockage_percent == null ? 'Chưa hỗ trợ' : record.blockage_percent + '%';
  const image = record.annotated_image_url ? `<img src="${window.location.origin + record.annotated_image_url}" style="width:220px;max-width:100%;border-radius:8px;margin-top:8px" />` : '';
  return `<div style="min-width:190px"><strong>DrainGuard #${record.id}</strong><br/>Status: ${record.status}<br/>Blockage: ${blockage}<br/>Drain: ${record.drain_count}<br/>${new Date(record.created_at).toLocaleString('vi-VN')}${image}</div>`;
}

export function AnalysisMap({ records }: { records: RecordItem[] }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let cancelled = false;

    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;

      map = new lib.Map({
        container: host.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [108.2, 16.05],
        zoom: 10,
      });

      for (const record of records) {
        if (record.longitude == null || record.latitude == null) continue;
        const marker = new lib.Marker()
          .setLngLat([record.longitude, record.latitude])
          .setPopup(new lib.Popup({ maxWidth: '280px' }).setHTML(popupHtml(record)))
          .addTo(map);
        void marker;
      }

      if (records.length === 1 && records[0].longitude != null && records[0].latitude != null) {
        map.flyTo({ center: [records[0].longitude, records[0].latitude], zoom: 15 });
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [records]);

  return <div ref={host} style={{ height: 480, borderRadius: 12, overflow: 'hidden' }} />;
}
