'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, MapPin, ShieldCheck, AlertTriangle, Siren } from 'lucide-react';
import { api } from '@/services/api';
import type { RecordItem, Status } from '@/types';
import { AnalysisMap } from '@/components/analysis-map';
import 'maplibre-gl/dist/maplibre-gl.css';

const labels: Record<string,string> = {
  LOW:'Thông thoáng',
  MODERATE:'Theo dõi',
  HIGH:'Cảnh báo',
  CRITICAL:'Nguy hiểm',
};

const filterOptions: Array<'ALL'|Status> = ['ALL','LOW','MODERATE','HIGH','CRITICAL'];

export default function Map() {
  const [status,setStatus]=useState<'ALL'|Status>('ALL');

  const {data=[],error,isFetching,refetch}=useQuery({
    queryKey:['map-records'],
    queryFn:()=>api<RecordItem[]>('/records?limit=100'),
  });

  const mapped=useMemo(
    ()=>data.filter(x=>x.latitude!=null&&x.longitude!=null&&(status==='ALL'||x.status===status)),
    [data,status]
  );

  const uniqueLocations=useMemo(
    ()=>new Set(mapped.map(x=>x.latitude!.toFixed(5)+','+x.longitude!.toFixed(5))).size,
    [mapped]
  );

  const counts=useMemo(()=>({
    low:data.filter(x=>x.status==='LOW'&&x.latitude!=null&&x.longitude!=null).length,
    moderate:data.filter(x=>x.status==='MODERATE'&&x.latitude!=null&&x.longitude!=null).length,
    high:data.filter(x=>x.status==='HIGH'&&x.latitude!=null&&x.longitude!=null).length,
    critical:data.filter(x=>x.status==='CRITICAL'&&x.latitude!=null&&x.longitude!=null).length,
  }),[data]);

  return (
    <main className="main user-page map-page">
      <div className="map-page-header">
        <div>
          <div className="eyebrow">DRAINGUARD AI · MONITORING MAP</div>
          <div className="map-title-row">
            <h1 className="title user-title">Bản đồ giám sát</h1>
            <span className="live-chip"><span /> LIVE</span>
          </div>
          <p className="lead">Theo dõi vị trí các miệng thu nước và mức cảnh báo được ghi nhận từ ảnh thực tế.</p>
        </div>
        <button className="map-refresh" onClick={()=>refetch()} disabled={isFetching}>
          <RefreshCw size={16} className={isFetching ? 'spin' : ''}/>
          {isFetching ? 'Đang cập nhật' : 'Cập nhật'}
        </button>
      </div>

      <section className="map-workspace">
        <div className="map-topbar">
          <div className="map-location-summary">
            <div className="map-summary-icon"><MapPin size={18}/></div>
            <div>
              <b>{uniqueLocations} vị trí</b>
              <span>{mapped.length} lượt kiểm tra trong vùng đang xem</span>
            </div>
          </div>

          <div className="map-filter">
            <span>Hiển thị</span>
            <select value={status} onChange={e=>setStatus(e.target.value as 'ALL'|Status)}>
              <option value="ALL">Tất cả mức cảnh báo</option>
              {filterOptions.slice(1).map(x=><option key={x} value={x}>{labels[x]}</option>)}
            </select>
          </div>
        </div>

        {error && <div className="notice map-error">{error.message}</div>}

        {mapped.length ? (
          <div className="map-stage">
            <AnalysisMap records={mapped}/>

            <div className="map-overlay map-overlay-left">
              <div className="map-overlay-title">Mức cảnh báo</div>
              <div className="map-legend-grid">
                <span><i className="legend-drain"/> Miệng thu nước</span>
                <span><i className="legend-zone low"/> {labels.LOW}</span>
                <span><i className="legend-zone moderate"/> {labels.MODERATE}</span>
                <span><i className="legend-zone high"/> {labels.HIGH}</span>
                <span><i className="legend-zone critical"/> {labels.CRITICAL}</span>
              </div>
            </div>

            <div className="map-overlay map-overlay-right">
              <div className="map-mini-stat"><ShieldCheck size={16}/><b>{counts.low}</b><span>ổn định</span></div>
              <div className="map-mini-stat warn"><AlertTriangle size={16}/><b>{counts.moderate + counts.high}</b><span>cần theo dõi</span></div>
              <div className="map-mini-stat danger"><Siren size={16}/><b>{counts.critical}</b><span>nguy hiểm</span></div>
            </div>

            <div className="map-overlay map-overlay-bottom">
              <span>Chọn biểu tượng drain để xem ảnh, blockage, GPS và lịch sử tại vị trí đó.</span>
            </div>
          </div>
        ) : (
          <div className="empty-map">
            <div className="empty-map-icon"><MapPin size={30}/></div>
            <h2>Chưa có vị trí trên bản đồ</h2>
            <p>Phân tích ảnh và cho phép GPS để DrainGuard ghi nhận vị trí kiểm tra.</p>
          </div>
        )}
      </section>
    </main>
  );
}
