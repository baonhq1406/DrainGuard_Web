'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { RecordItem, Status } from '@/types';
import { AnalysisMap } from '@/components/analysis-map';
import 'maplibre-gl/dist/maplibre-gl.css';

const labels: Record<string,string> = { LOW:'Thông thoáng', MODERATE:'Theo dõi', HIGH:'Cảnh báo', CRITICAL:'Nguy hiểm', MODEL_LIMITED:'Chưa đủ dữ liệu AI', NO_DRAIN:'Không nhận diện được drain' };
const filterOptions: Array<'ALL'|Status> = ['ALL','LOW','MODERATE','HIGH','CRITICAL'];

export default function Map() {
  const [status,setStatus]=useState<'ALL'|Status>('ALL');
  const {data=[],error,isFetching,refetch}=useQuery({queryKey:['map-records'],queryFn:()=>api<RecordItem[]>('/records?limit=100')});
  const mapped=useMemo(()=>data.filter(x=>x.latitude!=null&&x.longitude!=null&&(status==='ALL'||x.status===status)),[data,status]);
  const uniqueLocations=useMemo(()=>new Set(mapped.map(x=>x.latitude!.toFixed(5)+','+x.longitude!.toFixed(5))).size,[mapped]);
  return <main className="main user-page">
    <div className="user-heading"><div className="eyebrow">BẢN ĐỒ DRAINGUARD</div><h1 className="title user-title">Theo dõi các miệng thu nước</h1><p className="lead">Mỗi biểu tượng là một vị trí đã được kiểm tra. Vùng màu quanh vị trí thể hiện mức cảnh báo hiện tại.</p></div>
    <section className="map-toolbar"><div><b>{uniqueLocations}</b> vị trí · <b>{mapped.length}</b> lượt kiểm tra</div><div className="map-controls"><select value={status} onChange={e=>setStatus(e.target.value as 'ALL'|Status)}><option value="ALL">Tất cả mức cảnh báo</option>{filterOptions.slice(1).map(x=><option key={x} value={x}>{labels[x]}</option>)}</select><button className="button outline" onClick={()=>refetch()} disabled={isFetching}>{isFetching?'Đang tải...':'Làm mới'}</button></div></section>
    {error&&<div className="notice">{error.message}</div>}
    <section className="user-map-card">{mapped.length?<><AnalysisMap records={mapped}/><div className="map-help"><span className="legend-item"><i className="legend-drain"/> Miệng thu nước</span><span className="legend-item"><i className="legend-zone low"/> Thông thoáng</span><span className="legend-item"><i className="legend-zone moderate"/> Theo dõi</span><span className="legend-item"><i className="legend-zone high"/> Cảnh báo</span><span className="legend-item"><i className="legend-zone critical"/> Nguy hiểm</span></div><div className="map-note">Lớp vùng hiện tại là vùng cảnh báo suy ra từ trạng thái AI. Khi tích hợp dữ liệu mưa, địa hình và mực nước, lớp này sẽ chuyển sang mô hình ngập theo khu vực.</div></>:<div className="empty-map"><div className="upload-icon">📍</div><h2>Chưa có vị trí</h2><p>Phân tích ảnh và cho phép GPS để điểm kiểm tra xuất hiện tại đây.</p></div>}</section>
  </main>;
}