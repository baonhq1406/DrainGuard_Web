'use client';

import { useRef, useState, type DragEvent, type MouseEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  ScanSearch,
  Sparkles,
  X,
} from 'lucide-react';
import { api, files } from '@/services/api';

type AnalysisResponse = {
  success: boolean;
  analysis_id?: number;
  timestamp?: string;
  original_image_url?: string;
  annotated_image_url: string;
  location?: {
    latitude: number | null;
    longitude: number | null;
  };
  result: {
    drain_detected: boolean;
    drain_count: number;
    confidence: number | null;
    blockage_percent: number | null;
    status: string;
  };
  drains: Array<{ confidence: number; blockage_percent?: number }>;
};

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'THÔNG THOÁNG', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  MODERATE: { label: 'CÓ NGUY CƠ TẮC', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  HIGH: { label: 'TẮC NHIỀU RÁC', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  CRITICAL: { label: 'BÁO ĐỘNG ĐỎ · TẮC NGHIÊM TRỌNG', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  NO_DRAIN: { label: 'KHÔNG PHÁT HIỆN MIỆNG CỐNG', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  MODEL_LIMITED: { label: 'CHƯA ĐỦ DỮ LIỆU ĐO LƯỜNG', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
};

const QUICK_SAMPLES = [
  {
    title: 'Hải Châu · Hùng Vương',
    desc: 'Bọc rác sinh hoạt lớn',
    tag: 'Tắc 78%',
    color: '#ef4444',
    url: '/demo/drain-sample-2.jpg',
    filename: 'hung-vuong-sample.jpg',
  },
  {
    title: 'Thanh Khê · Lê Duẩn',
    desc: 'Lá cây & bùn đất che phủ',
    tag: 'Tắc 41%',
    color: '#f59e0b',
    url: '/demo/drain-raw.jpg',
    filename: 'le-duan-sample.jpg',
  },
  {
    title: 'Hải Châu · Chợ Cồn',
    desc: 'Túi nilon sinh hoạt dạt vào',
    tag: 'Tắc 64%',
    color: '#f97316',
    url: '/demo/drain-sample-4.jpg',
    filename: 'cho-con-sample.jpg',
  },
  {
    title: 'Sơn Trà · Bạch Đằng',
    desc: 'Mặt lưới thông thoáng',
    tag: 'An toàn 0%',
    color: '#10b981',
    url: '/demo/drain-sample-5.jpg',
    filename: 'bach-dang-sample.jpg',
  },
];

export default function Analyze() {
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const resultSliderRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<AnalysisResponse>();
  const [loading, setLoading] = useState(false);
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'ok' | 'unavailable'>('idle');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  function chooseFile(next?: File) {
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(undefined);
    setError('');
    setSliderPos(50);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    if (!dropped.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp ảnh (JPG, PNG hoặc WebP).');
      return;
    }
    chooseFile(dropped);
  }

  async function loadQuickSample(sample: typeof QUICK_SAMPLES[0]) {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      chooseFile(new File([blob], sample.filename, { type: 'image/jpeg' }));
    } catch (err) {
      console.error('Không tải được ảnh mẫu', err);
    }
  }

  async function getLocation(form: FormData) {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      return;
    }
    setLocationState('loading');
    await new Promise<void>(resolve =>
      navigator.geolocation.getCurrentPosition(
        p => {
          form.append('latitude', String(p.coords.latitude));
          form.append('longitude', String(p.coords.longitude));
          setLocationState('ok');
          resolve();
        },
        () => {
          setLocationState('unavailable');
          resolve();
        },
        { enableHighAccuracy: true, timeout: 7000 }
      )
    );
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(undefined);
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

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview('');
    setResult(undefined);
    setError('');
    setSliderPos(50);
  }

  // Result Slider Move
  function handleSliderMove(clientX: number) {
    if (!resultSliderRef.current) return;
    const rect = resultSliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }

  const status = result?.result.status || '';
  const currentBadge = statusBadge[status] || {
    label: status || 'KẾT QUẢ PHÂN TÍCH',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
  };
  const blockage = result?.result.blockage_percent;
  const confidence = result?.result.confidence;

  // Gauge calculations for SVG
  const gaugeVal = blockage != null ? Math.min(100, Math.max(0, blockage)) : 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * gaugeVal) / 100;
  const gaugeColor =
    gaugeVal > 70 ? '#ef4444' : gaugeVal > 40 ? '#f97316' : gaugeVal > 20 ? '#f59e0b' : '#10b981';

  return (
    <div className="visual-space-home" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      {/* 1. Ambient Lighting & Space Backdrop */}
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      <main id="main" className="analyze-page-wrap">
        {/* Hidden File Inputs */}
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

        {/* Header */}
        <div className="analyze-header">
          <div className="hero-pill-indicator" style={{ marginBottom: '14px' }}>
            <span className="radar-ping-dot" />
            <span>THỊ GIÁC MÁY TÍNH HIỆN TRƯỜNG · YOLO26l-Seg</span>
          </div>

          <h1 className="analyze-title">
            Chẩn đoán miệng thu nước. <br />
            <span className="title-glow-cyan">Định vị bít tắc &amp; phân tách AI.</span>
          </h1>
        </div>

        {/* 2. Optical Diagnostic Viewport Frame */}
        <div className="diagnostic-viewport-frame">
          {/* Cybernetic HUD Corner Brackets */}
          <div className="hud-corner tl" />
          <div className="hud-corner tr" />
          <div className="hud-corner bl" />
          <div className="hud-corner br" />

          {/* VIEW 1: No File Selected (Cybernetic Dropzone) */}
          {!file && (
            <div>
              <div
                className={`diagnostic-dropzone ${dragOver ? 'is-over' : ''}`}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => pickerRef.current?.click()}
              >
                <div className="diagnostic-reticle-icon">
                  <ScanSearch size={36} />
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 12px' }}>
                  Thả ảnh hoặc Chụp trực tiếp hiện trường
                </h2>

                <div className="hero-telemetry-chips" style={{ marginBottom: '22px' }}>
                  <span className="hero-telemetry-pill">📷 JPG / PNG / WEBP</span>
                  <span className="hero-telemetry-pill">📍 Tự động gắn GPS</span>
                  <span className="hero-telemetry-pill">⚡ YOLO26l-Seg 38ms</span>
                </div>

                <div className="diagnostic-actions-row" onClick={e => e.stopPropagation()}>
                  <label htmlFor="camera-picker" className="btn-glow-primary" style={{ cursor: 'pointer' }}>
                    <Camera size={18} />
                    <span>Mở máy ảnh chụp ngay</span>
                  </label>
                  <label htmlFor="image-picker" className="btn-glass-secondary" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={18} />
                    <span>Chọn tệp từ máy</span>
                  </label>
                </div>
              </div>

              {/* Quick Real Sample Strip */}
              <div className="quick-samples-strip" style={{ padding: '0 20px 24px' }}>
                <div className="quick-samples-title">
                  ✦ HOẶC THỬ NGHIỆM NHANH VỚI ẢNH ĐƯỜNG PHỐ ĐÀ NẴNG
                </div>
                <div className="quick-samples-grid">
                  {QUICK_SAMPLES.map((s, idx) => (
                    <div
                      key={idx}
                      className="quick-sample-card"
                      onClick={() => loadQuickSample(s)}
                    >
                      <img src={s.url} alt={s.title} />
                      <div style={{ overflow: 'hidden' }}>
                        <div className="sample-info-title">{s.title}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {s.desc}
                        </div>
                        <div className="sample-info-tag" style={{ color: s.color }}>
                          ● {s.tag}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: File Selected - Image Preview Stage (Before Run or While Loading) */}
          {file && !result && (
            <div>
              <div className="diagnostic-stage">
                <img src={preview} alt="Ảnh chuẩn bị phân tích" className="diagnostic-stage-img" />

                {/* Scanning Laser Beam Animation during loading */}
                {loading && (
                  <div className="diagnostic-scan-overlay">
                    <div className="diagnostic-laser-beam" />
                    <div className="diagnostic-telemetry-hud">
                      <Loader2 size={32} className="spin" style={{ color: '#00f2fe', margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                        {locationState === 'loading'
                          ? 'ĐANG GHI NHẬN TỌA ĐỘ GPS THỰC ĐỊA...'
                          : 'YOLO26L-SEG ĐANG PHÂN TÁCH VẬT CẢN...'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px' }}>
                        Độ trễ xử lý ~38ms · Trích xuất vùng bít tắc
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Control Bar */}
              <div className="diagnostic-stage-bar">
                <div className="stage-file-info">
                  <Cpu size={18} className="text-sky-400" />
                  <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    ({(file.size / 1024 / 1024).toFixed(1)} MB)
                  </span>

                  <span
                    className={`gps-status-pill ${
                      locationState === 'ok' ? 'ok' : locationState === 'loading' ? 'loading' : 'off'
                    }`}
                  >
                    <MapPin size={12} />
                    <span>
                      {locationState === 'ok'
                        ? 'GPS: Đã kết nối'
                        : locationState === 'loading'
                        ? 'GPS: Đang dò...'
                        : 'GPS: Chưa cấp quyền'}
                    </span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-glow-primary"
                    disabled={loading}
                    onClick={run}
                    style={{ padding: '10px 22px' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        <span>Đang quét AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Bắt đầu phân tích AI</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-glass-secondary"
                    disabled={loading}
                    onClick={reset}
                    style={{ padding: '10px 16px' }}
                  >
                    <X size={16} />
                    <span>Đổi ảnh</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: Result Mode - Split-Screen Interactive Comparison Stage */}
          {result && (
            <div>
              <div className="stage-slider-bar">
                <div className="slider-bar-left">
                  <Sparkles size={15} className="text-sky-400" />
                  <span>So sánh thị giác: Ảnh chụp thực địa ↔ AI phân tách vật cản</span>
                </div>
                <div className="slider-bar-hint">
                  <span>↔ Kéo thanh trượt laser để so sánh</span>
                </div>
              </div>

              <div
                ref={resultSliderRef}
                className="diagnostic-stage"
                onMouseMove={e => handleSliderMove(e.clientX)}
                onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
                onClick={e => handleSliderMove(e.clientX)}
                style={{ cursor: 'ew-resize' }}
              >
                {/* Base: Raw Image */}
                <img src={preview} alt="Ảnh thực địa gốc" className="stage-img-raw" />

                {/* Overlay: AI Annotated Output with clipPath */}
                <div
                  className="stage-img-overlay-clip"
                  style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
                >
                  <img
                    src={files(result.annotated_image_url)}
                    alt="Ảnh AI khoanh vùng rác"
                    className="stage-img-annotated"
                  />
                </div>

                {/* Laser Divider */}
                <div className="stage-divider" style={{ left: `${sliderPos}%` }}>
                  <div className="stage-handle">
                    <span>↔</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="stage-tag stage-tag-left">📷 Ảnh thực địa gốc</div>
                <div className="stage-tag stage-tag-right">✨ AI YOLO26l-Seg phát hiện vật cản</div>
              </div>
            </div>
          )}
        </div>

        {/* Error Notice */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              marginBottom: '24px',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            ✕ {error}
          </div>
        )}

        {/* 3. Diagnostic Result Panel (Zero Box-in-Box Clutter) */}
        {result && (
          <div className="diagnostic-result-panel">
            {/* Header Status & Action Buttons */}
            <div className="result-header-row">
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    color: currentBadge.color,
                    background: currentBadge.bg,
                    border: `1px solid ${currentBadge.color}40`,
                  }}
                >
                  {currentBadge.label}
                </span>
                <h2 className="result-status-title">
                  {blockage != null ? `Tắc nghẽn bề mặt: ${blockage}%` : currentBadge.label}
                </h2>
                <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                  {result.result.drain_count > 0
                    ? `Đã nhận diện ${result.result.drain_count} miệng thu nước trong phạm vi quan sát.`
                    : 'Không phát hiện thấy miệng thu nước rõ ràng trong bức ảnh.'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  href={
                    result.location?.latitude && result.location?.longitude
                      ? `/map?lat=${result.location.latitude}&lng=${result.location.longitude}`
                      : '/map'
                  }
                  className="btn-glow-primary"
                  style={{ padding: '10px 20px', fontSize: '13.5px' }}
                >
                  <MapPin size={16} />
                  <span>Xem trên Bản đồ GIS 3D</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  className="btn-glass-secondary"
                  onClick={reset}
                  style={{ padding: '10px 18px', fontSize: '13.5px' }}
                >
                  <RefreshCw size={15} />
                  <span>Kiểm tra ảnh khác</span>
                </button>
              </div>
            </div>

            {/* Circular Gauge & Telemetry Stats Grid */}
            <div className="diagnostic-metrics-grid">
              {/* Circular Gauge */}
              <div className="gauge-box-card">
                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                  <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="8"
                    />
                    {/* Animated Progress Ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={gaugeColor}
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      style={{
                        transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                        filter: `drop-shadow(0 0 8px ${gaugeColor}80)`,
                      }}
                    />
                  </svg>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <b style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                        {blockage != null ? `${blockage}%` : '—'}
                      </b>
                      <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>
                        Tắc nghẽn
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 700, color: gaugeColor }}>
                  {gaugeVal > 70
                    ? 'Nguy cơ ngập cục bộ'
                    : gaugeVal > 40
                    ? 'Cần cử đội vệ sinh'
                    : gaugeVal > 20
                    ? 'Theo dõi thêm'
                    : 'Lưu thông tốt'}
                </div>
              </div>

              {/* Telemetry Chips */}
              <div className="telemetry-chips-row">
                <div className="telemetry-chip">
                  <span>Độ tin cậy mô hình</span>
                  <b style={{ color: '#38bdf8' }}>
                    {confidence != null ? `${(confidence * 100).toFixed(1)}%` : '—'}
                  </b>
                </div>

                <div className="telemetry-chip">
                  <span>Miệng cống phát hiện</span>
                  <b>{result.result.drain_count} vị trí</b>
                </div>

                <div className="telemetry-chip">
                  <span>Tọa độ thực địa</span>
                  <b style={{ fontSize: '15px', color: '#e2e8f0', marginTop: '8px' }}>
                    {result.location?.latitude && result.location?.longitude
                      ? `${result.location.latitude.toFixed(4)}° N, ${result.location.longitude.toFixed(4)}° E`
                      : 'Chưa có GPS'}
                  </b>
                </div>

                <div className="telemetry-chip">
                  <span>Mô hình suy luận</span>
                  <b style={{ fontSize: '15px', color: '#a78bfa', marginTop: '8px' }}>
                    YOLO26l-Seg
                  </b>
                </div>
              </div>
            </div>

            {/* Multiple Drains Breakdown if > 1 */}
            {result.drains.length > 1 && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  CHI TIẾT TỪNG MIỆNG CỐNG TRÊN ẢNH
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {result.drains.map((drain, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: 'rgba(10, 16, 30, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Miệng thu #{idx + 1}</span>
                      <b style={{ fontSize: '14px', color: '#ffffff' }}>
                        {drain.blockage_percent != null ? `${drain.blockage_percent}%` : '—'}
                      </b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
