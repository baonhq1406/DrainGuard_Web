'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, files } from '@/services/api';
import type { Model, RecordItem, Status } from '@/types';

const statuses: Array<['ALL' | Status, string]> = [
  ['ALL', 'Tất cả'],
  ['LOW', 'LOW'],
  ['MODERATE', 'MODERATE'],
  ['HIGH', 'HIGH'],
  ['CRITICAL', 'CRITICAL'],
  ['MODEL_LIMITED', 'MODEL_LIMITED'],
  ['NO_DRAIN', 'NO_DRAIN'],
];

export default function History() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | Status>('ALL');
  const [modelId, setModelId] = useState('ALL');
  const [selected, setSelected] = useState<RecordItem>();

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => api<Model[]>('/models'),
  });

  const query = new URLSearchParams();
  if (search.trim()) query.set('q', search.trim());
  if (status !== 'ALL') query.set('status', status);
  if (modelId !== 'ALL') query.set('model_id', modelId);
  query.set('limit', '100');

  const { data = [], error } = useQuery({
    queryKey: ['records', search, status, modelId],
    queryFn: () => api<RecordItem[]>('/records?' + query.toString()),
  });

  async function remove(id: number) {
    if (!window.confirm('Xóa bản ghi phân tích này?')) return;
    try {
      await api('/records/' + id, { method: 'DELETE' });
      if (selected?.id === id) setSelected(undefined);
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['recent'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      setSelected(undefined);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Không thể xóa bản ghi');
    }
  }

  return (
    <main className="main">
      <h1 className="title">Lịch sử phân tích</h1>
      <p className="lead">Tra cứu, lọc và xem chi tiết các lần phân tích đã lưu.</p>

      <section className="panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1fr) 180px 220px', gap: 10 }}>
          <input placeholder="Tìm theo model, version hoặc trạng thái..." value={search} onChange={e => setSearch(e.target.value)} />
          <select value={status} onChange={e => setStatus(e.target.value as 'ALL' | Status)}>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={modelId} onChange={e => setModelId(e.target.value)}>
            <option value="ALL">Tất cả model</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.name} · {m.version}</option>)}
          </select>
        </div>
      </section>

      {error && <div className="notice">{error.message}</div>}

      <section className="panel">
        {data.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Ảnh</th><th>Thời gian</th><th>Model</th><th>Drain</th><th>Confidence</th><th>Blockage</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {data.map(x => (
                  <tr key={x.id} onClick={() => setSelected(x)} style={{ cursor: 'pointer' }}>
                    <td>{x.annotated_image_url && <img src={files(x.annotated_image_url)} width="72" alt="Kết quả" style={{ borderRadius: 8 }} />}</td>
                    <td>{new Date(x.created_at).toLocaleString('vi-VN')}</td>
                    <td>{x.model.name} · {x.model.version}</td>
                    <td>{x.drain_count}</td>
                    <td>{x.confidence == null ? '—' : `${(x.confidence * 100).toFixed(0)}%`}</td>
                    <td>{x.blockage_percent == null ? '—' : `${x.blockage_percent}%`}</td>
                    <td><span className={'status ' + x.status}>{x.status}</span></td>
                    <td><button className="button outline" onClick={e => { e.stopPropagation(); remove(x.id); }}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="lead">Không có bản ghi phù hợp.</p>}
      </section>

      {selected && (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Chi tiết phân tích #{selected.id}</h2>
              <p className="label">{selected.model.name} · {selected.model.version} · {new Date(selected.created_at).toLocaleString('vi-VN')}</p>
            </div>
            <button className="button outline" onClick={() => setSelected(undefined)}>Đóng</button>
          </div>
          <div className="grid" style={{ marginTop: 14 }}>
            {[
              ['Drain', selected.drain_count],
              ['Confidence', selected.confidence == null ? '—' : `${(selected.confidence * 100).toFixed(1)}%`],
              ['Blockage', selected.blockage_percent == null ? '—' : `${selected.blockage_percent}%`],
              ['Status', selected.status],
            ].map(([k, v]) => <div className="card" key={String(k)}><div className="label">{k}</div><div className="metric">{v}</div></div>)}
          </div>
          {(selected.original_image_url || selected.annotated_image_url) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 18 }}>
              {selected.original_image_url && <div><div className="label">Ảnh gốc</div><img src={files(selected.original_image_url)} alt="Ảnh gốc" style={{ maxWidth: '100%', borderRadius: 12 }} /></div>}
              {selected.annotated_image_url && <div><div className="label">Ảnh AI</div><img src={files(selected.annotated_image_url)} alt="Ảnh AI" style={{ maxWidth: '100%', borderRadius: 12 }} /></div>}
            </div>
          )}
          <div style={{ marginTop: 16 }} className="label">
            GPS: {selected.latitude == null || selected.longitude == null ? 'Không có' : `${selected.latitude.toFixed(6)}, ${selected.longitude.toFixed(6)}`}
          </div>
        </section>
      )}
    </main>
  );
}
