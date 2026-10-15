'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Camera, ImagePlus, Loader2, MapPin, ScanSearch } from 'lucide-react';
import { api, files } from '@/services/api';

type AnalysisResponse = {
  annotated_image_url: string;
    result: {
    drain_detected: boolean;
    drain_count: number;
    confidence: number | null;
    blockage_percent: number | null;
    status: string;
  };

  drains: Array<{ confidence: number; blockage_percent?: number }>;
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
  const [dragOver, setDragOver] = useState(false);

  function chooseFile(next?: File) {
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview); // UI: giải phóng bộ nhớ ảnh xem trước cũ
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(undefined);
    setError('');
  }

  // UI: hỗ trợ kéo-thả ảnh (chỉ gọi lại chooseFile, không đổi luồng xử lý)
  function onDrop(e: DragEvent) {
    e.preventDefault(); setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!dropped.type.startsWith('image/')) { setError('Vui lòng chọn tệp ảnh (JPG, PNG hoặc WebP).'); return; }
    chooseFile(dropped);
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
      const form = new FormData();
      form.append('image', file);
      await getLocation(form);
      const data = await api<AnalysisResponse>('/analyze', {
        method: 'POST',
        body: form,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể phân tích ảnh.');
    } finally {
      setLoading(false);
    }
  }

  const status = result?.result.status || '';
  const blockage = result?.result.blockage_percent;
  const confidence = result?.result.confidence;

  return (
    <main id="main" className="main user-page">
      <div className="user-heading">
        <div className="eyebrow">DRAINGUARD AI</div>
        <h1 className="title user-title">Kiểm tra miệng thu nước</h1>
        <p className="lead">Chụp ảnh tại chỗ hoặc chọn ảnh có sẵn. Kết quả sẽ được lưu cùng vị trí GPS nếu bạn cho phép.</p>
      </div>
      <section className="user-upload-card" aria-busy={loading}>
        <input
          id="image-picker"
          ref={pickerRef}
          className="visually-hidden-file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={e => {
            chooseFile(e.target.files?.[0]);
            e.currentTarget.value = '';
          }}
        />
        <input
          id="camera-picker"
          ref={cameraRef}
          className="visually-hidden-file"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={e => {
            chooseFile(e.target.files?.[0]);
            e.currentTarget.value = '';
          }}
        />
        {!file ? (
          <div>
            <div
              className={'upload-empty dropzone' + (dragOver ? ' is-over' : '')}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="upload-icon"><Camera size={34} aria-hidden="true" style={{ color: '#0284c7' }} /></div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>Gửi ảnh miệng thu nước</h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 auto 18px', maxWidth: '480px' }}>
                Chụp ảnh trực tiếp từ camera hoặc tải ảnh có sẵn để AI quét và ước tính độ bít tắc.
              </p>
              <div className="upload-actions">
                <label htmlFor="image-picker" className="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <ImagePlus size={18} />
                  Chọn tệp ảnh
                </label>
                <label htmlFor="camera-picker" className="button outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Camera size={18} />
                  Chụp bằng camera
                </label>
              </div>
              <div className="upload-hint" style={{ marginTop: '14px', fontSize: '12px', color: '#94a3b8' }}>
                Hỗ trợ định dạng JPG, PNG hoặc WebP · Tự động ghi nhận GPS
              </div>
            </div>

            {/* Quick Test Sample Section */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #eef3f7' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#0284c7', textTransform: 'uppercase', marginBottom: '10px' }}>
                HOẶC THỬ NGHIỆM NGAY VỚI ẢNH THỰC ĐỊA MẪU
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div
                  onClick={async () => {
                    const res = await fetch('/demo/drain-sample-2.jpg');
                    const blob = await res.blob();
                    chooseFile(new File([blob], 'drain-hungvuong.jpg', { type: 'image/jpeg' }));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: '1px solid #e2edf5',
                    background: '#f8fbfe',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-sky-400 hover:bg-white"
                >
                  <img src="/demo/drain-sample-2.jpg" alt="Mẫu 1" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <b style={{ display: 'block', fontSize: '12px', color: '#0f2742' }}>Bọc rác lớn chắn cống</b>
                    <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>Nguy cơ cao (&gt;75%)</span>
                  </div>
                </div>

                <div
                  onClick={async () => {
                    const res = await fetch('/demo/drain-raw.jpg');
                    const blob = await res.blob();
                    chooseFile(new File([blob], 'drain-leduan.jpg', { type: 'image/jpeg' }));
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    border: '1px solid #e2edf5',
                    background: '#f8fbfe',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  className="hover:border-sky-400 hover:bg-white"
                >
                  <img src="/demo/drain-raw.jpg" alt="Mẫu 2" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <b style={{ display: 'block', fontSize: '12px', color: '#0f2742' }}>Lá cây & rác che lấp lưới</b>
                    <span style={{ fontSize: '10px', color: '#ca8a04', fontWeight: 700 }}>Có nguy cơ (41%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="selected-image">
            <div className="selected-preview preview-frame" style={{ position: 'relative', overflow: 'hidden' }}>
              <img src={preview} alt="Ảnh đã chọn để phân tích" />
              {loading && (
                <div className="analyzing" role="status" style={{ backdropFilter: 'blur(8px)', background: 'rgba(7, 26, 47, 0.75)' }}>
                  <div className="scanner-laser-beam" style={{ top: '40%' }} />
                  <Loader2 size={32} className="spin" style={{ color: '#00f2fe', margin: '0 auto 8px' }} />
                  <span style={{ color: '#fff', fontWeight: 700 }}>{locationState === 'loading' ? 'Đang lấy vị trí GPS thực địa…' : 'AI YOLO đang quét bít tắc…'}</span>
                </div>
              )}
            </div>
            <div className="selected-info">
              <div className="label">Ảnh đã chọn</div>
              <h2 style={{ overflowWrap: 'anywhere', fontSize: '20px', margin: '4px 0 6px' }}>{file.name}</h2>
              <p className="label">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              <div className="upload-actions">
                <button className="button" disabled={loading} onClick={run}>
                  {loading ? <><Loader2 size={18} className="spin" />Đang quét AI...</> : <><ScanSearch size={18} />Phân tích ảnh</>}
                </button>
                <button
                  type="button"
                  className="button outline"
                  disabled={loading}
                  onClick={() => pickerRef.current?.click()}
                >
                  Đổi ảnh khác
                </button>
              </div>
            </div>
          </div>
        )}
        <div className={'location-hint' + (locationState === 'ok' ? ' ok' : locationState === 'unavailable' ? ' off' : '')}>
          <MapPin size={20} aria-hidden="true" />
          <div><b>Vị trí thiết bị</b><div className="label">{locationState === 'ok' ? 'Đã ghi nhận tọa độ GPS thực địa.' : locationState === 'loading' ? 'Đang lấy vị trí...' : locationState === 'unavailable' ? 'Không lấy được GPS; ảnh vẫn được phân tích bình thường.' : 'Tọa độ GPS sẽ tự động ghi nhận khi bạn bấm Phân tích.'}</div></div>
        </div>
      </section>
      {error && <div className="notice error" role="alert">{error}</div>}
      {result && (
        <section className={'result-card tone-' + status} aria-live="polite">
          <div className="result-head">
            <div>
              <div className="eyebrow">KẾT QUẢ PHÂN TÍCH AI</div>
              <h2 style={{ fontSize: '24px', margin: '4px 0' }}>{statusLabel[status] || status}</h2>
              <p className="label">{result.result.drain_count} miệng thu nước được nhận diện trên ảnh</p>
            </div>
            <span className={'status ' + status}>{statusLabel[status] || status}</span>
          </div>

          <div className="result-image" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #dce8ef' }}>
            <img src={files(result.annotated_image_url)} alt="Kết quả AI phân tích" />
          </div>

          <div className="result-metrics">
            <div className="user-metric">
              <span>Độ tắc nghẽn bề mặt</span>
              <b style={{ color: blockage && blockage > 70 ? '#dc2626' : blockage && blockage > 40 ? '#ea580c' : '#16a34a' }}>
                {blockage == null ? '—' : blockage + '%'}
              </b>
              {blockage != null && (
                <div className="meter" role="img" aria-label={'Độ tắc nghẽn ' + blockage + '%'} style={{ height: '8px', borderRadius: '4px', background: '#e2edf5', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: Math.min(100, Math.max(0, blockage)) + '%',
                    background: blockage > 70 ? '#dc2626' : blockage > 40 ? '#ea580c' : '#16a34a',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              )}
            </div>
            <div className="user-metric">
              <span>Độ tin cậy AI</span>
              <b>{confidence == null ? '—' : (confidence * 100).toFixed(1) + '%'}</b>
            </div>
            <div className="user-metric">
              <span>Số miệng thu nước</span>
              <b>{result.result.drain_count}</b>
            </div>
          </div>
          {result.drains.length > 1 && (
            <div className="drain-list">
              <h3>Chi tiết từng miệng thu nước</h3>
              {result.drains.map((drain, index) => (
                <div className="drain-row" key={index}>
                  <span>Miệng thu #{index + 1}</span>
                  <b>{drain.blockage_percent == null ? '—' : drain.blockage_percent + '%'}</b>
                </div>
              ))}
            </div>
          )}
          {blockage == null && (
            <div className="notice" style={{ marginTop: '14px' }}>
              Mô hình AI hiện tại chưa đủ thông tin để tính phần trăm tắc nghẽn cho ảnh này.
            </div>
          )}
        </section>
      )}
    </main>
  );
}
