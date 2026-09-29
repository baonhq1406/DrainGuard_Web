'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, MapPin, ShieldCheck, TriangleAlert, CircleAlert } from 'lucide-react';
import { api } from '@/services/api';
import type { RecordItem, Status } from '@/types';
import { AnalysisMap } from '@/components/analysis-map';
import 'maplibre-gl/dist/maplibre-gl.css';

const labels: Record<string,string> = {
  LOW:'Thông thoáng',
  MODERATE:'Theo dõi',
  HIGH:'Cảnh báo',
  CRITICAL:'Nguy hiểm',
  MODEL_LIMITED:'Chưa đủ dữ liệu AI',
  NO_DRAIN:'Không nhận diện được drain'
};

const filterOptions: Array<'ALL'|Status> = ['ALL','LOW','MODERATE','HIGH','CRITICAL'];

export default function Map() {
  const [status,setStatus]=useState<'ALL'|Status>('ALL');
  const {data=[],error,isFetching,refetch}=useQuery({
    queryKey:['map-records'],
    queryFn:()=>api<RecordItem[]>('/records?limit=100')
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
    critical:data.filter(x=>x.status==='CRITICAL'&&x.latitude!=null&&x.longitude!=null).length
  }),[data]);

  return <main className="main user-page map-page">
    <div className="map-page-header">
      <div>
        <div className="eyebrow">DRAINGUARD AI · GIS MONITORING</div>
        <h1 className="title user-title">Bản đồ giám sát</h1>
        <p className="lead">Theo dõi các miệng thu nước đã kiểm tra, mức cảnh báo và vị trí trên bản đồ thực.</p>
      </div>
      <button className="button outline map-refresh" onClick={()=>refetch()} disabled={isFetching}>
        <RefreshCw size={17} className={isFetching?'spin':''}/>
        {isFetching?'Đang cập nhật':'Làm mới dữ liệu'}
      </button>
    </div>

    <section className="map-summary">
      <div className="map-stat"><span className="stat-icon"><MapPin size={18}/></span><div><b>{uniqueLocations}</b><small>Vị trí đã ghi nhận</small></div></div>
      <div className="map-stat"><span className="stat-icon success"><ShieldCheck size={18}/></span><div><b>{counts.low}</b><small>Thông thoáng</small></div></div>
      <div className="map-stat"><span className="stat-icon warning"><TriangleAlert size={18}/></span><div><b>{counts.moderate + counts.high}</b><small>Cần theo dõi</small></div></div>
      <div className="map-stat"><span className="stat-icon danger"><CircleAlert size={18}/></span><div><b>{counts.critical}</b><small>Nguy hiểm</small></div></div>
    </section>

    <section className="map-shell">
      <div className="map-topbar">
        <div>
          <h2>Vị trí kiểm tra</h2>
          <p>{mapped.length} lượt · {uniqueLocations} vị trí trong vùng lọc</p>
        </div>
        <div className="map-controls">
          <span className="map-filter-label">Hiển thị</span>
          <select value={status} onChange={e=>setStatus(e.target.value as 'ALL'|Status)}>
            <option value="ALL">Tất cả mức cảnh báo</option>
            {filterOptions.slice(1).map(x=><option key={x} value={x}>{labels[x]}</option>)}
          </select>
        </div>
      </div>

      {error&&<div className="notice map-error">{error.message}</div>}

      {mapped.length ? (
        <>
          <div className="map-canvas-wrap"><AnalysisMap records={mapped}/></div>
          <div className="map-footer">
            <div className="map-legend">
              <span><i className="legend-drain"/> Miệng thu nước</span>
              <span><i className="legend-zone low"/> Thông thoáng</span>
              <span><i className="legend-zone moderate"/> Theo dõi</span>
              <span><i className="legend-zone high"/> Cảnh báo</span>
              <span><i className="legend-zone critical"/> Nguy hiểm</span>
            </div>
            <div className="map-caption">Chọn một biểu tượng drain để xem chi tiết các lần kiểm tra tại vị trí đó.</div>
          </div>
        </>
      ) : (
        <div className="empty-map">
          <div className="empty-map-icon"><MapPin size={32}/></div>
          <h2>Chưa có vị trí trên bản đồ</h2>
          <p>Phân tích ảnh và cho phép GPS để DrainGuard ghi nhận điểm kiểm tra.</p>
        </div>
      )}
    </section>
  </main>;
}
