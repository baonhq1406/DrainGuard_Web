'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { api, files } from '@/services/api';
import { EmptyState, StatusBadge, TableSkeleton, statusText } from '@/components/ui';
import type { Model, RecordItem, Status } from '@/types';

const statuses: Array<['ALL' | Status, string]> = [
  ['ALL', 'Tất cả mức độ'],
  ['LOW', statusText.LOW],
  ['MODERATE', statusText.MODERATE],
  ['HIGH', statusText.HIGH],
  ['CRITICAL', statusText.CRITICAL],
  ['MODEL_LIMITED', statusText.MODEL_LIMITED],
  ['NO_DRAIN', statusText.NO_DRAIN],
];

export default function History() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | Status>('ALL');
  const [modelId, setModelId] = useState('ALL');
  const [selected, setSelected] = useState<RecordItem>();
  const detailRef = useRef<HTMLElement>(null);

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => api<Model[]>('/models'),
  });

  const query = new URLSearchParams();
  if (search.trim()) query.set('q', search.trim());
  if (status !== 'ALL') query.set('status', status);
  if (modelId !== 'ALL') query.set('model_id', modelId);
  query.set('limit', '100');

  const { data = [], error, isLoading } = useQuery({
    queryKey: ['records', search, status, modelId],
    queryFn: () => api<RecordItem[]>('/records?' + query.toString()),
  });

  // UI: khi chọn một dòng, cuộn xuống panel chi tiết để người dùng không phải tự tìm
  useEffect(() => {
    if (selected) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <main id="main" className="main">
      <h1 className="title">Lịch sử phân tích</h1>
      <p className="lead">Tra cứu, lọc và xem chi tiết các lần phân tích đã lưu.</p>

      <section className="panel" aria-label="Bộ lọc">
        <div className="filter-bar">
          <input aria-label="Tìm kiếm" placeholder="Tìm theo model, version hoặc trạng thái..." value={search} onChange={e => setSearch(e.target.value)} />
          <select aria-label="Lọc theo mức độ" value={status} onChange={e => setStatus(e.target.value as 'ALL' | Status)}>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Lọc theo model" value={modelId} onChange={e => setModelId(e.target.value)}>
            <option value="ALL">Tất cả model</option>
            {models.map(m => <option key={m.id} value={m.id}>{m.name} · {m.version}</option>)}
          </select>
        </div>
      </section>

      {error && <div className="notice error" role="alert">{error.message}</div>}

      <section className="panel">
        <div className="panel-head"><h2>Kết quả</h2><span className="label">{isLoading ? 'Đang tải…' : data.length + ' bản ghi'}</span></div>
        {isLoading ? <TableSkeleton /> : data.length ? (
          <div className="table-wrap">
            <table className="rtable">
              <thead><tr><th>Ảnh</th><th>Thời gian</th><th>Model</th><th>Drain</th><th>Confidence</th><th>Blockage</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {data.map(x => (
                  <tr
                    key={x.id}
                    className={'is-clickable' + (selected?.id === x.id ? ' is-selected' : '')}
                    tabIndex={0}
                    aria-label={'Xem chi tiết bản ghi #' + x.id}
                    onClick={() => setSelected(x)}
                    onKeyDown={e => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(x); } }}
                  >
                    <td data-label="Ảnh">{x.annotated_image_url && <img className="thumb" src={files(x.annotated_image_url)} loading="lazy" alt="Kết quả" />}</td>
                    <td data-label="Thời gian">{new Date(x.created_at).toLocaleString('vi-VN')}</td>
                    <td data-label="Model">{x.model.name} · {x.model.version}</td>
                    <td data-label="Drain">{x.drain_count}</td>
                    <td data-label="Confidence">{x.confidence == null ? '—' : `${(x.confidence * 100).toFixed(0)}%`}</td>
                    <td data-label="Blockage">{x.blockage_percent == null ? '—' : `${x.blockage_percent}%`}</td>
                    <td data-label="Trạng thái"><StatusBadge status={x.status} /></td>
                    <td data-label=""><button className="button outline danger sm" aria-label={'Xóa bản ghi #' + x.id} onClick={e => { e.stopPropagation(); remove(x.id); }}><Trash2 size={15} />Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Không có bản ghi phù hợp">Thử đổi từ khóa hoặc bộ lọc.</EmptyState>}
      </section>

      {selected && (
        <section className="panel" ref={detailRef} aria-label={'Chi tiết phân tích #' + selected.id}>
          <div className="panel-head">
            <div>
              <h2>Chi tiết phân tích #{selected.id}</h2>
              <p className="label">{selected.model.name} · {selected.model.version} · {new Date(selected.created_at).toLocaleString('vi-VN')}</p>
            </div>
            <button className="button outline" onClick={() => setSelected(undefined)}>Đóng</button>
          </div>
          <div className="grid">
            {[
              ['Drain', selected.drain_count],
              ['Confidence', selected.confidence == null ? '—' : `${(selected.confidence * 100).toFixed(1)}%`],
              ['Blockage', selected.blockage_percent == null ? '—' : `${selected.blockage_percent}%`],
            ].map(([k, v]) => <div className="card" key={String(k)}><div className="label">{k}</div><div className="metric">{v}</div></div>)}
            <div className="card"><div className="label">Trạng thái</div><div style={{ marginTop: 12 }}><StatusBadge status={selected.status} /></div></div>
          </div>
          {(selected.original_image_url || selected.annotated_image_url) && (
            <div className="detail-grid">
              {selected.original_image_url && <div className="img-frame"><div className="label">Ảnh gốc</div><img src={files(selected.original_image_url)} alt="Ảnh gốc" /></div>}
              {selected.annotated_image_url && <div className="img-frame"><div className="label">Ảnh AI</div><img src={files(selected.annotated_image_url)} alt="Ảnh AI" /></div>}
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
