'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import type { Model } from '@/types';

type SystemInfo = {
  backend: string;
  database: string;
  cuda_available: boolean;
  gpu_name?: string | null;
  device: string;
  model_loaded: boolean;
  active_model_id?: number | null;
  model_task?: string | null;
  model_classes?: string[] | null;
};

type Tone = 'ok' | 'bad' | 'off' | '';

export default function System() {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['system'],
    queryFn: () => api<SystemInfo>('/system'),
    refetchInterval: 15000,
  });
  const { data: models = [] } = useQuery({
    queryKey: ['system-models'],
    queryFn: () => api<Model[]>('/models'),
    refetchInterval: 15000,
  });
  const active = models.find(m => m.is_active);

  // Giá trị hiển thị giữ nguyên như bản cũ; cột thứ 3 chỉ là màu chấm trạng thái (UI).
  const rows: Array<[string, string, Tone]> = [
    ['Backend API', data?.backend === 'ok' ? 'ONLINE' : '—', data?.backend === 'ok' ? 'ok' : error ? 'bad' : 'off'],
    ['Database', data?.database === 'ok' ? 'ONLINE' : 'UNAVAILABLE', data?.database === 'ok' ? 'ok' : data ? 'bad' : 'off'],
    ['Device', data?.device || '—', ''],
    ['CUDA', data?.cuda_available ? 'Available' : 'Unavailable', data?.cuda_available ? 'ok' : 'off'],
    ['GPU', data?.gpu_name || '—', ''],
    ['Model loaded', data?.model_loaded ? 'YES' : 'NO', data?.model_loaded ? 'ok' : data ? 'bad' : 'off'],
    ['Model task', data?.model_task || '—', ''],
    ['Classes', data?.model_classes?.join(', ') || '—', ''],
  ];

  const ready = data?.backend === 'ok' && data?.database === 'ok' && data?.model_loaded;

  return (
    <main id="main" className="main">
      <div className="page-head">
        <div>
          <h1 className="title">Hệ thống</h1>
          <p className="lead">Theo dõi backend, database, GPU và model AI đang hoạt động.</p>
        </div>
        <button className="button outline" onClick={() => refetch()} disabled={isFetching} style={{ marginBottom: 24 }}>
          <RefreshCw size={16} className={isFetching ? 'spin' : ''} />{isFetching ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
        </button>
      </div>

      {error && <div className="notice error" role="alert">{error.message}</div>}
      {data && (ready
        ? <div className="notice success" role="status">Hệ thống sẵn sàng: backend, database và model đều hoạt động.</div>
        : <div className="notice warn" role="status">Hệ thống chưa sẵn sàng hoàn toàn. Kiểm tra các mục màu đỏ bên dưới.</div>)}

      <section className="panel">
        <div className="grid">
          {rows.map(([label, value, tone]) => (
            <div className="card" key={label}>
              <div className="label">{label}</div>
              <div className="metric break" style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                {tone && <i className={'dot ' + tone} aria-hidden="true" />}{value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Model active</h2>
        {active ? (
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card"><div className="label">Tên</div><div className="metric break" style={{ fontSize: 18 }}>{active.name}</div></div>
            <div className="card"><div className="label">Version</div><div className="metric break" style={{ fontSize: 18 }}>{active.version}</div></div>
            <div className="card"><div className="label">Task</div><div className="metric break" style={{ fontSize: 18 }}>{active.task || '—'}</div></div>
            <div className="card"><div className="label">imgsz</div><div className="metric break" style={{ fontSize: 18 }}>{active.imgsz ?? '—'}</div></div>
          </div>
        ) : (
          <div className="notice warn">Chưa có model ACTIVE. Vào AI Models để kích hoạt một model.</div>
        )}
      </section>
    </main>
  );
}
