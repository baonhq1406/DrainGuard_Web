'use client';

import { useQuery } from '@tanstack/react-query';
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

  const rows = [
    ['Backend API', data?.backend === 'ok' ? 'ONLINE' : '—'],
    ['Database', data?.database === 'ok' ? 'ONLINE' : 'UNAVAILABLE'],
    ['Device', data?.device || '—'],
    ['CUDA', data?.cuda_available ? 'Available' : 'Unavailable'],
    ['GPU', data?.gpu_name || '—'],
    ['Model loaded', data?.model_loaded ? 'YES' : 'NO'],
    ['Model task', data?.model_task || '—'],
    ['Classes', data?.model_classes?.join(', ') || '—'],
  ];

  return (
    <main className="main">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <h1 className="title">Hệ thống</h1>
          <p className="lead">Theo dõi backend, database, GPU và model AI đang hoạt động.</p>
        </div>
        <button className="button outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
        </button>
      </div>

      {error && <div className="notice">{error.message}</div>}

      <section className="panel">
        <div className="grid">
          {rows.map(([label, value]) => (
            <div className="card" key={label}>
              <div className="label">{label}</div>
              <div className="metric" style={{ fontSize: 18 }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Model active</h2>
        {active ? (
          <div className="grid" style={{ marginTop: 12 }}>
            <div className="card"><div className="label">Tên</div><div className="metric" style={{ fontSize: 18 }}>{active.name}</div></div>
            <div className="card"><div className="label">Version</div><div className="metric" style={{ fontSize: 18 }}>{active.version}</div></div>
            <div className="card"><div className="label">Task</div><div className="metric" style={{ fontSize: 18 }}>{active.task || '—'}</div></div>
            <div className="card"><div className="label">imgsz</div><div className="metric" style={{ fontSize: 18 }}>{active.imgsz ?? '—'}</div></div>
          </div>
        ) : (
          <div className="notice">Chưa có model ACTIVE.</div>
        )}
      </section>
    </main>
  );
}
