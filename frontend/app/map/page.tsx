'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { RecordItem, Status } from '@/types';
import { AnalysisMap } from '@/components/analysis-map';
import 'maplibre-gl/dist/maplibre-gl.css';

const statuses: Array<'ALL' | Status> = ['ALL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'MODEL_LIMITED', 'NO_DRAIN'];
const labels: Record<string, string> = { LOW: 'Thông thoáng', MODERATE: 'Có nguy cơ tắc', HIGH: 'Tắc nhiều', CRITICAL: 'Tắc nghiêm trọng', MODEL_LIMITED: 'Chưa đủ dữ liệu AI', NO_DRAIN: 'Không nhận diện được drain' };

export default function Map() {
  const [status, setStatus] = useState<'ALL' | Status>('ALL');
  const { data = [], error, isFetching, refetch } = useQuery({ queryKey: ['map-records'], queryFn: () => api<RecordItem[]>('/records?limit=100') });
  const mapped = useMemo(() => data.filter(x => x.latitude != null && x.longitude != null && (status === 'ALL' || x.status === status)), [data, status]);
  const uniqueLocations = useMemo(() => new Set(mapped.map(x => x.latitude!.toFixed(5) + ',' + x.longitude!.toFixed(5))).size, [mapped]);
  return <main className="main user-page">
    <div className="user-heading"><div className="eyebrow">BẢN ĐỒ</div><h1 className="title user-title">Khu vực đã kiểm tra</h1><p className="lead">Xem các vị trí đã ghi nhận bằng GPS và mở từng điểm để xem kết quả.</p></div>
    <section className="map-toolbar"><div><b>{uniqueLocations}</b> vị trí · <b>{mapped.length}</b> lượt kiểm tra</div><div className="map-controls"><select value={status} onChange={e => setStatus(e.target.value as 'ALL' | Status)}><option value="ALL">Tất cả trạng thái</option>{statuses.slice(1).map(x => <option key={x} value={x}>{labels[x]}</option>)}</select><button className="button outline" onClick={() => refetch()} disabled={isFetching}>{isFetching ? 'Đang tải...' : 'Làm mới'}</button></div></section>
    {error && <div className="notice">{error.message}</div>}
    <section className="user-map-card">{mapped.length ? <><AnalysisMap records={mapped}/><div className="map-help"><span className="legend-dot low"/> Thông thoáng <span className="legend-dot high"/> Tắc nhiều <span className="legend-dot critical"/> Tắc nghiêm trọng</div></> : <div className="empty-map"><div className="upload-icon">📍</div><h2>Chưa có vị trí</h2><p>Phân tích ảnh và cho phép GPS để điểm kiểm tra xuất hiện tại đây.</p></div>}</section>
  </main>;
}