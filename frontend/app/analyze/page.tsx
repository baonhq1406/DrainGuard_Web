'use client';

import { useRef, useState } from 'react';
import { files } from '@/services/api';

type AnalysisResponse = {
  annotated_image_url: string;
  result: {
    drain_detected: boolean;
    drain_count: number;
    confidence: number | null;
    blockage_percent: number | null;
    status: string;
    drains: Array<{ confidence: number; blockage_percent?: number }>;
  };
};

const statusLabel: Record<string, string> = {
  LOW: 'Thông thoáng',
  MODERATE: 'Có nguy cơ tắc',
  HIGH: 'Tắc nhiều',
  CRITICAL: 'Tắc nghiêm trọng',
  NO_DRAIN: 'Không nhận diện được miệng thu nước',
  MODEL_LIMITED: 'Chưa đủ dữ liệu AI',
};

export default function Analyze() {
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<AnalysisResponse>();
  const [loading, setLoading] = useState(false);
  const [locationState, setLocationState] = useState<'idle'|'loading'|'ok'|'unavailable'>('idle');
  const [error, setError] = useState('');

  function chooseFile(next?: File) {
    if (!next) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(undefined);
    setError('');
  }

  async function getLocation(form: FormData) {
    if (!navigator.geolocation) { setLocationState('unavailable'); return; }
    setLocationState('loading');
    await new Promise<void>(resolve => navigator.geolocation.getCurrentPosition(
      p => { form.append('latitude', String(p.coords.latitude)); form.append('longitude', String(p.coords.longitude)); setLocationState('ok'); resolve(); },
      () => { setLocationState('unavailable'); resolve(); },
      { enableHighAccuracy: true, timeout: 7000 }
    ));
  }

  async function run() {
    if (!file) return;
    setLoading(true); setError(''); setResult(undefined);
    try {
      const form = new FormData(); form.append('image', file); await getLocation(form);
      const response = await fetch((process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api') + '/analyze', { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Không thể phân tích ảnh.');
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể phân tích ảnh.'); }
    finally { setLoading(false); }
  }

  const status = result?.result.status || '';
  const blockage = result?.result.blockage_percent;
  const confidence = result?.result.confidence;

  return (
    <main className="main user-page">
      <div className="user-heading">
        <div className="eyebrow">DRAINGUARD AI</div>
        <h1 className="title user-title">Kiểm tra miệng thu nước</h1>
        <p className="lead">Chụp ảnh tại chỗ hoặc chọn ảnh có sẵn. Kết quả sẽ được lưu cùng vị trí GPS nếu bạn cho phép.</p>
      </div>
      <section className="user-upload-card">
        <input ref={pickerRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={e => chooseFile(e.target.files?.[0])} />
        <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={e => chooseFile(e.target.files?.[0])} />
        {!file ? (
          <div className="upload-empty">
            <div className="upload-icon">📷</div>
            <h2>Gửi ảnh miệng thu nước</h2>
            <p>Chọn một ảnh có sẵn hoặc chụp ảnh mới bằng camera.</p>
            <div className="upload-actions">
              <button className="button" onClick={() => pickerRef.current?.click()}>Chọn ảnh</button>
              <button className="button outline" onClick={() => cameraRef.current?.click()}>Chụp ảnh</button>
            </div>
          </div>
        ) : (
          <div className="selected-image">
            <div className="selected-preview"><img src={preview} alt="Ảnh đã chọn" /></div>
            <div className="selected-info">
              <div className="label">Ảnh đã chọn</div>
              <h2>{file.name}</h2>
              <p className="label">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <div className="upload-actions">
                <button className="button" disabled={loading} onClick={run}>{loading ? 'Đang phân tích...' : 'Phân tích ảnh'}</button>
                <button className="button outline" disabled={loading} onClick={() => pickerRef.current?.click()}>Đổi ảnh</button>
              </div>
            </div>
          </div>
        )}
        <div className="location-hint">
          <span>📍</span>
          <div><b>Vị trí thiết bị</b><div className="label">{locationState === 'ok' ? 'Đã ghi nhận GPS.' : locationState === 'loading' ? 'Đang lấy vị trí...' : locationState === 'unavailable' ? 'Không lấy được GPS; ảnh vẫn được phân tích.' : 'GPS sẽ được lấy khi bạn bấm Phân tích.'}</div></div>
        </div>
      </section>
      {error && <div className="notice">{error}</div>}
      {result && (
        <section className="result-card">
          <div className="result-head">
            <div><div className="eyebrow">KẾT QUẢ</div><h2>{statusLabel[status] || status}</h2><p className="label">{result.result.drain_count} miệng thu nước được nhận diện</p></div>
            <span className={'status ' + status}>{statusLabel[status] || status}</span>
          </div>
          <div className="result-image"><img src={files(result.annotated_image_url)} alt="Kết quả AI" /></div>
          <div className="result-metrics">
            <div className="user-metric"><span>Độ tắc nghẽn</span><b>{blockage == null ? '—' : blockage + '%'}</b></div>
            <div className="user-metric"><span>Độ tin cậy</span><b>{confidence == null ? '—' : (confidence * 100).toFixed(1) + '%'}</b></div>
            <div className="user-metric"><span>Miệng thu nước</span><b>{result.result.drain_count}</b></div>
          </div>
          {result.result.drains.length > 1 && <div className="drain-list"><h3>Chi tiết từng miệng thu nước</h3>{result.result.drains.map((drain, index) => <div className="drain-row" key={index}><span>Miệng thu #{index + 1}</span><span>{drain.blockage_percent == null ? '—' : drain.blockage_percent + '%'}</span></div>)}</div>}
          {blockage == null && <div className="notice">Model hiện tại chưa đủ thông tin để tính phần trăm tắc nghẽn cho ảnh này.</div>}
        </section>
      )}
    </main>
  );
}