'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { RecordItem, Status } from '@/types';
import { AnalysisMap } from '@/components/analysis-map';
import 'maplibre-gl/dist/maplibre-gl.css';

const statuses: Array<'ALL' | Status> = ['ALL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'MODEL_LIMITED', 'NO_DRAIN'];

export default function Map() {
  const [status, setStatus] = useState<'ALL' | Status>('ALL');
  const { data = [], error, isFetching, refetch } = useQuery({
    queryKey: ['map-records'],
    queryFn: () => api<RecordItem[]>('/records?limit=100'),
  });

  const mapped = useMemo(
    () => data.filter(x => x.latitude != null && x.longitude != null && (status === 'ALL' || x.status === status)),
    [data, status]
  );

  return (
    <main className="main">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <h1 className="title">Bản đồ giám sát</h1>
          <p className="lead">Các điểm phân tích có GPS và trạng thái tắc nghẽn.</p>
        </div>
        <button className="button outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="notice">{error.message}</div>}

      <section className="panel">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <span className="label">Lọc trạng thái</span>
          {statuses.map(x => (
            <button key={x} className={'button ' + (status === x ? '' : 'outline')} onClick={() => setStatus(x)}>
              {x === 'ALL' ? 'Tất cả' : x}
            </button>
          ))}
          <span className="label" style={{ marginLeft: 6 }}>{mapped.length} điểm có GPS</span>
        </div>

        {mapped.length ? (
          <>
            <AnalysisMap records={mapped} />
            <div style={{ overflowX: 'auto', marginTop: 18 }}>
              <table>
                <thead>
                  <tr><th>Vị trí</th><th>Thời gian</th><th>Model</th><th>Drain</th><th>Blockage</th><th>Trạng thái</th></tr>
                </thead>
                <tbody>
                  {mapped.map(x => (
                    <tr key={x.id}>
                      <td>{x.latitude?.toFixed(5)}, {x.longitude?.toFixed(5)}</td>
                      <td>{new Date(x.created_at).toLocaleString('vi-VN')}</td>
                      <td>{x.model.version}</td>
                      <td>{x.drain_count}</td>
                      <td>{x.blockage_percent == null ? '—' : x.blockage_percent + '%'}</td>
                      <td><span className={'status ' + x.status}>{x.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="notice">
            {status === 'ALL' ? 'Chưa có record kèm GPS.' : 'Không có điểm GPS phù hợp với trạng thái đang lọc.'}
          </div>
        )}
      </section>
    </main>
  );
}
