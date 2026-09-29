'use client';

import { useEffect, useRef } from 'react';
import type { RecordItem, EnvironmentItem } from '@/types';
import { files } from '@/services/api';

const STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
const statusRank: Record<string,number> = { LOW:1, MODERATE:2, HIGH:3, CRITICAL:4, MODEL_LIMITED:0, NO_DRAIN:0 };
const statusColor: Record<string,string> = { LOW:'#15803d', MODERATE:'#b7791f', HIGH:'#dc6b18', CRITICAL:'#c9362d', MODEL_LIMITED:'#64748b', NO_DRAIN:'#64748b' };
const statusLabel: Record<string,string> = { LOW:'Thông thoáng', MODERATE:'Theo dõi', HIGH:'Cảnh báo', CRITICAL:'Nguy hiểm', MODEL_LIMITED:'Chưa đủ dữ liệu AI', NO_DRAIN:'Không nhận diện được drain' };
const zoneRadius: Record<string,number> = { LOW:35, MODERATE:65, HIGH:100, CRITICAL:150, MODEL_LIMITED:28, NO_DRAIN:24 };

function esc(value:string|number|null|undefined){
  return String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]!));
}
function locationKey(record:RecordItem){ return record.latitude!.toFixed(5)+','+record.longitude!.toFixed(5); }
function worstRecord(records:RecordItem[]){ return records.reduce((a,b)=>(statusRank[b.status]||0)>(statusRank[a.status]||0)?b:a,records[0]); }

function riskCircleFeature(lon:number,lat:number,radiusMeters:number,level:string,score:number|null){
  const points:number[][]=[]; const latFactor=111320; const lonFactor=111320*Math.cos(lat*Math.PI/180);
  for(let i=0;i<=48;i++){ const angle=i/48*Math.PI*2; points.push([lon+Math.cos(angle)*radiusMeters/lonFactor,lat+Math.sin(angle)*radiusMeters/latFactor]); }
  return {type:'Feature',properties:{level,score},geometry:{type:'Polygon',coordinates:[points]}};
}

function drainMarkerElement(level:string){
  const el=document.createElement('div');
  el.className='drain-marker';
  el.innerHTML='<div class="drain-marker-ring" style="--drain-level:'+statusColor[level]+'"><svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="18" fill="#173042"/><circle cx="21" cy="21" r="15" fill="#3d596b" stroke="#edf5f8" stroke-width="1.5"/><g stroke="#edf5f8" stroke-width="1.9" stroke-linecap="round"><path d="M12 15h18M10 21h22M12 27h18"/><path d="M15 12v18M21 11v20M27 12v18"/></g></svg></div>';
  return el;
}

function popupHtml(records:RecordItem[],address?:string,environment?:EnvironmentItem){
  const latest=[...records].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime())[0];
  const worst=worstRecord(records);
  const image=latest.annotated_image_url ? '<img class="dg-popup-image" src="'+files(latest.annotated_image_url)+'" alt="Ảnh AI"/>' : '<div class="dg-popup-image dg-popup-placeholder">Chưa có ảnh AI</div>';
  return '<div class="dg-popup">'+
    '<div class="dg-popup-head"><div><div class="dg-popup-kicker">DRAINGUARD AI</div><h3>Miệng thu nước</h3><div class="dg-popup-sub">'+records.length+' lượt kiểm tra tại vị trí này</div></div>'+
    '<span class="dg-popup-badge" style="--badge:'+statusColor[worst.status]+'">'+esc(statusLabel[worst.status]||worst.status)+'</span></div>'+
    image+
    '<div class="dg-popup-environment">'+
      '<div><span>Mưa</span><b>'+esc(environment?.precipitation_mm_h==null?'—':environment.precipitation_mm_h+' mm/h')+'</b></div>'+
      '<div><span>Cao độ</span><b>'+esc(environment?.elevation_m==null?'—':environment.elevation_m+' m')+'</b></div>'+
      '<div><span>Rủi ro ngập</span><b>'+esc(environment?.flood_risk_score==null?'—':environment.flood_risk_score+' / 100')+'</b></div>'+
    '</div>'+
    '<div class="dg-popup-grid">'+
      '<div><span>Blockage</span><b>'+esc(latest.blockage_percent==null?'—':latest.blockage_percent+'%')+'</b></div>'+
      '<div><span>Confidence</span><b>'+esc(latest.confidence==null?'—':(latest.confidence*100).toFixed(1)+'%')+'</b></div>'+
      '<div><span>Drain</span><b>'+esc(latest.drain_count)+'</b></div>'+
    '</div>'+
    '<div class="dg-popup-location"><span class="dg-pin">⌖</span><div><b>Vị trí</b><span>'+esc(latest.latitude?.toFixed(6))+', '+esc(latest.longitude?.toFixed(6))+'</span><span class="dg-address">'+esc(address||'Chưa tra cứu địa chỉ')+'</span></div></div>'+
    '<div class="dg-popup-actions"><button type="button" data-dg-geocode="1">Tra cứu địa chỉ</button><button type="button" data-dg-open-history="1">Xem lịch sử</button></div>'+
    '<div class="dg-history" data-dg-history="1"><div class="dg-history-title">Các lần kiểm tra gần đây</div>'+
      records.slice().sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,6).map(r=>'<div class="dg-history-row"><div><b>#'+esc(r.id)+'</b><span>'+esc(new Date(r.created_at).toLocaleString('vi-VN'))+'</span></div><div><b>'+esc(r.blockage_percent==null?'—':r.blockage_percent+'%')+'</b><span>'+esc(statusLabel[r.status]||r.status)+'</span></div></div>').join('')+
    '</div>'+
  '</div>';
}

export function AnalysisMap({records,environment=[]}:{records:RecordItem[];environment?:EnvironmentItem[]}){
  const host=useRef<HTMLDivElement>(null);
  const addressCache=useRef(new Map<string,string>());
  const environmentCache=new Map(environment.map(x=>[x.latitude.toFixed(5)+','+x.longitude.toFixed(5),x]));

  useEffect(()=>{
    let map:any; let cancelled=false;
    (async()=>{
      const lib=await import('maplibre-gl');
      if(cancelled||!host.current)return;
      const grouped=new Map<string,RecordItem[]>();
      for(const record of records){
        if(record.latitude==null||record.longitude==null)continue;
        const key=locationKey(record); grouped.set(key,[...(grouped.get(key)||[]),record]);
      }
      const groups=[...grouped.values()];
      const points=groups.map(g=>g[0]);
      map=new lib.Map({container:host.current,style:STYLE_URL,center:[108.2,16.05],zoom:12,attributionControl:true});
      map.addControl(new lib.NavigationControl({visualizePitch:true}),'top-right');
      map.addControl(new lib.ScaleControl({maxWidth:120,unit:'metric'}),'bottom-left');
      map.on('load',()=>{
        if(!points.length)return;
        const bounds=new lib.LngLatBounds();
        const zoneFeatures=groups.map(group=>{const worst=worstRecord(group);bounds.extend([group[0].longitude!,group[0].latitude!]);return riskCircleFeature(group[0].longitude!,group[0].latitude!,Math.max(45,Math.min(240,45+(environmentCache.get(locationKey(group[0]))?.flood_risk_score||0)*1.8)),environmentCache.get(locationKey(group[0]))?.flood_risk_level||worst.status,environmentCache.get(locationKey(group[0]))?.flood_risk_score??null);});
        map.addSource('drainguard-zones',{type:'geojson',data:{type:'FeatureCollection',features:zoneFeatures}});
        map.addLayer({id:'drainguard-zone-fill',type:'fill',source:'drainguard-zones',paint:{'fill-color':['match',['get','level'],'CRITICAL','#c9362d','HIGH','#dc6b18','MODERATE','#b7791f','LOW','#15803d','#64748b'],'fill-opacity':['interpolate',['linear'],['coalesce',['get','score'],0],0,0.04,35,0.07,60,0.10,80,0.14,100,0.18]}});
        map.addLayer({id:'drainguard-zone-line',type:'line',source:'drainguard-zones',paint:{'line-color':['match',['get','level'],'CRITICAL','#c9362d','HIGH','#dc6b18','MODERATE','#b7791f','LOW','#15803d','#64748b'],'line-width':1.2,'line-opacity':0.35,'line-dasharray':[2,2]}});
        if(points.length===1)map.flyTo({center:[points[0].longitude!,points[0].latitude!],zoom:17});
        else map.fitBounds(bounds,{padding:85,maxZoom:16,duration:650});

        for(const [key,group] of grouped){
          const worst=worstRecord(group);
          const env=environmentCache.get(key);
          const marker=new lib.Marker({element:drainMarkerElement(worst.status),anchor:'center'}).setLngLat([group[0].longitude!,group[0].latitude!]).setPopup(new lib.Popup({maxWidth:'390px',closeButton:true}).setHTML(popupHtml(group,addressCache.current.get(key),env))).addTo(map);
          marker.getElement().setAttribute('title','Miệng thu nước · '+(statusLabel[worst.status]||worst.status));
          marker.getPopup().on('open',()=>{
            const popupNode=marker.getPopup().getElement(); if(!popupNode)return;
            const geoButton=popupNode.querySelector('[data-dg-geocode="1"]') as HTMLButtonElement|null;
            const historyButton=popupNode.querySelector('[data-dg-open-history="1"]') as HTMLButtonElement|null;
            const history=popupNode.querySelector('[data-dg-history="1"]') as HTMLElement|null;
            if(historyButton&&history){history.style.display='none';historyButton.onclick=()=>{history.style.display=history.style.display==='none'?'block':'none';historyButton.textContent=history.style.display==='none'?'Xem lịch sử':'Ẩn lịch sử';};}
            if(!geoButton)return;
            geoButton.onclick=async()=>{
              geoButton.disabled=true; geoButton.textContent='Đang tra cứu...'; const addressNode=popupNode.querySelector('.dg-address');
              try{
                let label=addressCache.current.get(key);
                if(!label){
                  const point=group[0]; const url=new URL('https://nominatim.openstreetmap.org/reverse');
                  url.searchParams.set('format','jsonv2'); url.searchParams.set('lat',String(point.latitude)); url.searchParams.set('lon',String(point.longitude)); url.searchParams.set('zoom','18'); url.searchParams.set('addressdetails','1');
                  const response=await fetch(url.toString(),{headers:{Accept:'application/json'}}); if(!response.ok)throw new Error();
                  const data=await response.json(); label=data.display_name||'Không tìm thấy địa chỉ.'; addressCache.current.set(key,label);
                }
                if(addressNode)addressNode.textContent=label; geoButton.textContent='Đã tra cứu';
              }catch{if(addressNode)addressNode.textContent='Không tra cứu được.';geoButton.disabled=false;geoButton.textContent='Thử lại';}
            };
          });
        }
      });
    })();
    return()=>{cancelled=true;map?.remove();};
  },[records]);

  return <div ref={host} className="analysis-map"/>;
}
