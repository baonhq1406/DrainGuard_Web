'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem } from '@/types';

const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
const statusRank: Record<string, number> = { LOW: 1, MODERATE: 2, HIGH: 3, CRITICAL: 4, MODEL_LIMITED: 0, NO_DRAIN: 0 };
const statusColor: Record<string, string> = { LOW: '#0879c9', MODERATE: '#b08a00', HIGH: '#ef7c00', CRITICAL: '#b5221d', MODEL_LIMITED: '#66809a', NO_DRAIN: '#66809a' };
const zoneRadius: Record<string, number> = { LOW: 45, MODERATE: 85, HIGH: 140, CRITICAL: 220, MODEL_LIMITED: 35, NO_DRAIN: 30 };

function esc(value: string | number | null | undefined) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]!));
}
function locationKey(record: RecordItem) { return record.latitude!.toFixed(5) + ',' + record.longitude!.toFixed(5); }
function worstRecord(records: RecordItem[]) { return records.reduce((a,b) => (statusRank[b.status] || 0) > (statusRank[a.status] || 0) ? b : a, records[0]); }

function circleFeature(lon: number, lat: number, radiusMeters: number, level: string) {
  const points: number[][] = [];
  const latFactor = 111320;
  const lonFactor = 111320 * Math.cos(lat * Math.PI / 180);
  for (let i=0; i<=48; i++) {
    const angle = (i / 48) * Math.PI * 2;
    points.push([lon + (Math.cos(angle) * radiusMeters) / lonFactor, lat + (Math.sin(angle) * radiusMeters) / latFactor]);
  }
  return { type: 'Feature', properties: { level }, geometry: { type: 'Polygon', coordinates: [points] } };
}

function drainMarkerElement(level: string) {
  const el = document.createElement('div');
  el.className = 'drain-marker';
  el.setAttribute('aria-label', 'Vị trí miệng thu nước');
  el.innerHTML = '<div class="drain-marker-ring" style="--drain-level:' + statusColor[level] + '"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="18" fill="#0d2638"/><circle cx="21" cy="21" r="15" fill="#334b5a" stroke="#dce7ed" stroke-width="1.5"/><g stroke="#dce7ed" stroke-width="2" stroke-linecap="round"><path d="M12 15h18M10 21h22M12 27h18"/><path d="M15 12v18M21 11v20M27 12v18"/></g></svg></div><span class="drain-marker-pulse"></span>';
  return el;
}

function popupHtml(records: RecordItem[], address?: string) {
  const first = records[0];
  const latest = [...records].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  const worst = worstRecord(records);
  const rows = records.slice().sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,8).map(r => '<div style="padding:7px 0;border-top:1px solid #e5e7eb"><b>#'+esc(r.id)+'</b> · '+esc(r.status)+'<br/>'+esc(r.blockage_percent == null ? 'Blockage: —' : 'Blockage: '+r.blockage_percent+'%')+' · Drain: '+esc(r.drain_count)+'<br/><span style="color:#64748b">'+esc(new Date(r.created_at).toLocaleString('vi-VN'))+'</span></div>').join('');
  return '<div style="min-width:270px;max-width:330px;font:13px/1.45 system-ui,sans-serif"><div style="font-size:16px;font-weight:700;margin-bottom:4px">Miệng thu nước · '+records.length+' lượt</div><div>Mức cảnh báo: <b>'+esc(worst.status)+'</b></div><div>Lần gần nhất: <b>'+esc(latest.status)+'</b></div><div>Tọa độ: '+esc(first.latitude?.toFixed(6))+', '+esc(first.longitude?.toFixed(6))+'</div><div style="margin-top:4px;color:#475569"><b>Địa chỉ:</b> <span class="dg-address">'+esc(address || 'Chưa tra cứu')+'</span></div><button type="button" data-dg-geocode="1" style="margin-top:8px;padding:6px 9px;border:1px solid #94a3b8;border-radius:7px;background:#fff;cursor:pointer">Tra cứu địa chỉ</button><div style="margin-top:8px">'+rows+'</div></div>';
}

export function AnalysisMap({ records }: { records: RecordItem[] }) {
  const host = useRef<HTMLDivElement>(null);
  const addressCache = useRef(new Map<string,string>());

  useEffect(() => {
    let map: any;
    let cancelled = false;
    (async () => {
      const lib = await import('maplibre-gl');
      if (cancelled || !host.current) return;
      const grouped = new Map<string,RecordItem[]>();
      for (const record of records) {
        if (record.latitude == null || record.longitude == null) continue;
        const key = locationKey(record);
        grouped.set(key,[...(grouped.get(key) || []),record]);
      }
      const points = [...grouped.values()].map(group => group[0]);
      map = new lib.Map({ container:host.current, style:STYLE_URL, center:[108.2,16.05], zoom:12, attributionControl:true });
      map.addControl(new lib.NavigationControl({ visualizePitch:true }), 'top-right');
      map.addControl(new lib.ScaleControl({ maxWidth:120, unit:'metric' }), 'bottom-left');
      map.on('load', () => {
        if (!points.length) return;
        const bounds = new lib.LngLatBounds();
        const zoneFeatures = [...grouped.entries()].map(([key,group]) => {
          const worst = worstRecord(group);
          bounds.extend([group[0].longitude!,group[0].latitude!]);
          return circleFeature(group[0].longitude!,group[0].latitude!,zoneRadius[worst.status] || 45,worst.status);
        });
        map.addSource('drainguard-zones',{ type:'geojson', data:{ type:'FeatureCollection', features:zoneFeatures } });
        map.addLayer({ id:'drainguard-zone-fill', type:'fill', source:'drainguard-zones', paint:{ 'fill-color':['match',['get','level'],'CRITICAL','#b5221d','HIGH','#ef7c00','MODERATE','#b08a00','LOW','#0879c9','#66809a'], 'fill-opacity':['match',['get','level'],'CRITICAL',0.18,'HIGH',0.16,'MODERATE',0.14,'LOW',0.10,0.08] } });
        map.addLayer({ id:'drainguard-zone-line', type:'line', source:'drainguard-zones', paint:{ 'line-color':['match',['get','level'],'CRITICAL','#b5221d','HIGH','#ef7c00','MODERATE','#b08a00','LOW','#0879c9','#66809a'], 'line-width':1.5, 'line-opacity':0.55 } });
        if (points.length === 1) map.flyTo({ center:[points[0].longitude!,points[0].latitude!], zoom:17 });
        else map.fitBounds(bounds,{ padding:70,maxZoom:16,duration:600 });
        for (const [key,group] of grouped) {
          const worst = worstRecord(group);
          const address = addressCache.current.get(key);
          const marker = new lib.Marker({ element:drainMarkerElement(worst.status), anchor:'center' }).setLngLat([group[0].longitude!,group[0].latitude!]).setPopup(new lib.Popup({maxWidth:'350px'}).setHTML(popupHtml(group,address))).addTo(map);
          marker.getElement().setAttribute('title','Miệng thu nước · '+worst.status);
          marker.getPopup().on('open',() => {
            const popupNode = marker.getPopup().getElement();
            const button = popupNode?.querySelector('[data-dg-geocode="1"]') as HTMLButtonElement | null;
            if (!button) return;
            button.onclick = async () => {
              button.disabled=true; button.textContent='Đang tra cứu...';
              const addressNode=popupNode.querySelector('.dg-address');
              try {
                let label=addressCache.current.get(key);
                if (!label) {
                  const point=group[0]; const url=new URL('https://nominatim.openstreetmap.org/reverse');
                  url.searchParams.set('format','jsonv2'); url.searchParams.set('lat',String(point.latitude)); url.searchParams.set('lon',String(point.longitude)); url.searchParams.set('zoom','18'); url.searchParams.set('addressdetails','1');
                  const response=await fetch(url.toString(),{headers:{Accept:'application/json'}}); if (!response.ok) throw new Error('Không thể tra cứu địa chỉ.');
                  const data=await response.json(); label=data.display_name || 'Không tìm thấy địa chỉ.'; addressCache.current.set(key,label);
                }
                if (addressNode) addressNode.textContent=label; button.textContent='Đã tra cứu';
              } catch { if (addressNode) addressNode.textContent='Không tra cứu được.'; button.disabled=false; button.textContent='Thử lại'; }
            };
          });
        }
      });
    })();
    return () => { cancelled=true; map?.remove(); };
  },[records]);
  return <div ref={host} className="analysis-map" />;
}