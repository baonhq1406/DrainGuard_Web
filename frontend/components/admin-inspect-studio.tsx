'use client';

import { useRef, useState, type DragEvent } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Camera,
  Compass,
  Crosshair,
  ImagePlus,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  ScanSearch,
  Sparkles,
  X,
} from 'lucide-react';
import { api, files } from '@/services/api';
import { LocationPickerMap } from '@/components/location-picker-map';

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

const LOCATION_PRESETS = [
  {
    name: '🎓 Cổng chính ĐH VKU',
    area: 'Nam Kỳ Khởi Nghĩa · Ngũ Hành Sơn',
    lat: 15.9752,
    lng: 108.2532,
  },
  {
    name: '🏫 Khu Giảng đường & KTX VKU',
    area: 'Khu Đô thị Đại học Đà Nẵng',
    lat: 15.9742,
    lng: 108.2521,
  },
  {
    name: '🛣️ Trục Trần Đại Nghĩa · VKU',
    area: 'Hòa Quý · Ngũ Hành Sơn',
    lat: 15.9765,
    lng: 108.2546,
  },
  {
    name: '🚨 Ngã tư Hùng Vương',
    area: 'Hải Châu · Trung tâm',
    lat: 16.0682,
    lng: 108.2208,
  },
  {
    name: '🏪 Khu vực Chợ Cồn',
    area: 'Ông Ích Khiêm · Hải Châu',
    lat: 16.0675,
    lng: 108.2144,
  },
  {
    name: '🌧️ Trục Lê Duẩn',
    area: 'Thanh Khê · Đà Nẵng',
    lat: 16.0705,
    lng: 108.2102,
  },
];

const QUICK_SAMPLES = [
  {
    title: 'ĐH VKU · Nam Kỳ Khởi Nghĩa',
    desc: 'Bọc rác sinh hoạt lớn',
    tag: 'Mẫu thực địa #1',
    color: '#ef4444',
    url: '/demo/drain-sample-2.jpg',
    filename: 'vku-drain-sample-1.jpg',
    lat: 15.9752,
    lng: 108.2532,
  },
  {
    title: 'Khu KTX VKU · Hòa Quý',
    desc: 'Lá cây & bùn đất che phủ',
    tag: 'Mẫu thực địa #2',
    color: '#f59e0b',
    url: '/demo/drain-raw.jpg',
    filename: 'vku-drain-sample-2.jpg',
    lat: 15.9742,
    lng: 108.2521,
  },
  {
    title: 'Trần Đại Nghĩa · Ngũ Hành Sơn',
    desc: 'Túi nilon sinh hoạt dạt vào',
    tag: 'Mẫu thực địa #3',
    color: '#f97316',
    url: '/demo/drain-sample-4.jpg',
    filename: 'tran-dai-nghia-sample.jpg',
    lat: 15.9765,
    lng: 108.2546,
  },
  {
    title: 'Sơn Trà · Bạch Đằng',
    desc: 'Mặt lưới thông thoáng',
    tag: 'Mẫu thực địa #4',
    color: '#10b981',
    url: '/demo/drain-sample-5.jpg',
    filename: 'bach-dang-sample.jpg',
    lat: 16.0648,
    lng: 108.2245,
  },
];

export function AdminInspectStudio() {
  const qc = useQueryClient();
  const pickerRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const resultSliderRef = useRef<HTMLDivElement>(null);

  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<AnalysisResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);

  // Admin Location Selection State (Default: VKU Campus)
  const [latitude, setLatitude] = useState<number>(15.9752);
  const [longitude, setLongitude] = useState<number>(108.2532);
  const [latInput, setLatInput] = useState<string>('15.975200');
  const [lngInput, setLngInput] = useState<string>('108.253200');
  const [locationLabel, setLocationLabel] = useState<string>('🎓 Cổng chính ĐH VKU (Mặc định)');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [updatingLoc, setUpdatingLoc] = useState(false);

  function setCoordinates(lat: number, lng: number, label?: string) {
    const cleanLat = Number(lat.toFixed(6));
    const cleanLng = Number(lng.toFixed(6));
    setLatitude(cleanLat);
    setLongitude(cleanLng);
    setLatInput(cleanLat.toFixed(6));
    setLngInput(cleanLng.toFixed(6));
    if (label) {
      setLocationLabel(label);
    } else {
      setLocationLabel('🎯 Đã ghim trực tiếp trên Bản đồ GIS');
    }
  }

  function chooseFile(next?: File) {
    if (!next) return;
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setResult(undefined);
    setError('');
    setNotice('');
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

  async function loadQuickSample(sample: (typeof QUICK_SAMPLES)[0]) {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      chooseFile(new File([blob], sample.filename, { type: 'image/jpeg' }));
      setCoordinates(sample.lat, sample.lng, `📍 ${sample.title}`);
    } catch (err) {
      console.error('Không tải được ảnh mẫu', err);
    }
  }

  function detectStandingGps() {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoordinates(pos.coords.latitude, pos.coords.longitude, '📡 Vị trí GPS thiết bị hiện tại');
        setGpsLoading(false);
      },
      () => {
        setError('Không lấy được GPS thiết bị. Bạn có thể chấm trực tiếp vị trí cống trên bản đồ bên phải.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }

  async function run() {
    if (!file) return;
    setLoading(true);
    setError('');
    setNotice('');
    setResult(undefined);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('latitude', String(latitude));
      form.append('longitude', String(longitude));

      const data = await api<AnalysisResponse>('/analyze', {
        method: 'POST',
        body: form,
      });
      setResult(data);
      setNotice(
        `Đã phân tích và ghim miệng cống #${data.analysis_id} tại tọa độ (${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E).`
      );
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      qc.invalidateQueries({ queryKey: ['admin-recent'] });
      qc.invalidateQueries({ queryKey: ['records'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể phân tích ảnh.');
    } finally {
      setLoading(false);
    }
  }

  async function updateExistingRecordLocation() {
    if (!result?.analysis_id) return;
    setUpdatingLoc(true);
    setError('');
    try {
      await api(`/records/${result.analysis_id}/location`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude }),
      });
      setResult(prev =>
        prev
          ? {
              ...prev,
              location: { latitude, longitude },
            }
          : prev
      );
      setNotice(
        `Đã cập nhật vị trí mới cho Miệng cống #${result.analysis_id} -> (${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E).`
      );
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['admin-recent'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể cập nhật vị trí.');
    } finally {
      setUpdatingLoc(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(undefined);
    setPreview('');
    setResult(undefined);
    setError('');
    setNotice('');
    setSliderPos(50);
  }

  function handleSliderMove(clientX: number) {
    if (!resultSliderRef.current) return;
    const rect = resultSliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
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

  const gaugeVal = blockage != null ? Math.min(100, Math.max(0, blockage)) : 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (circumference * gaugeVal) / 100;
  const gaugeColor =
    gaugeVal > 70 ? '#ef4444' : gaugeVal > 40 ? '#f97316' : gaugeVal > 20 ? '#f59e0b' : '#10b981';

  return (
    <div>
      {/* Hidden File Inputs */}
      <input
        id="admin-studio-image-picker"
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
        id="admin-studio-camera-picker"
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

      {notice && (
        <div className="admin-cyber-alert info" role="status">
          <Sparkles size={16} />
          <span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="admin-cyber-alert error" role="alert">
          <span>✕ {error}</span>
        </div>
      )}

      {/* 2-Column Studio: Left = AI Image Inspection, Right = GIS Coordinate Picker */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '22px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Optical Diagnostic Stage */}
        <div className="admin-glass-panel" style={{ padding: '20px' }}>
          <div className="admin-panel-head" style={{ marginBottom: '14px' }}>
            <div>
              <span className="admin-eyebrow">1. KIỂM TRA MIỆNG THU NƯỚC (AI YOLO26L-SEG)</span>
              <h2 className="admin-panel-title">Phân Tách Rác &amp; Đo Tỷ Lệ Bít Tắc</h2>
            </div>
            {file && (
              <button type="button" className="admin-quick-chip" onClick={reset} disabled={loading}>
                <X size={14} />
                <span>Đổi ảnh khác</span>
              </button>
            )}
          </div>

          {/* VIEW 1: Dropzone when no file selected */}
          {!file && (
            <div>
              <div
                className={`diagnostic-dropzone ${dragOver ? 'is-over' : ''}`}
                style={{ minHeight: '250px', padding: '26px 20px' }}
                onDragOver={e => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => pickerRef.current?.click()}
              >
                <div className="diagnostic-reticle-icon">
                  <ScanSearch size={34} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px' }}>
                  Tải ảnh miệng thu nước cần kiểm định
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px' }}>
                  Chọn vị trí cống trên bản đồ bên phải, sau đó tải ảnh để AI YOLO26l-Seg phân tách rác &amp; lưu vào GIS
                </p>

                <div className="diagnostic-actions-row" onClick={e => e.stopPropagation()}>
                  <label htmlFor="admin-studio-image-picker" className="btn-glow-primary" style={{ cursor: 'pointer' }}>
                    <ImagePlus size={17} />
                    <span>Chọn tệp ảnh từ máy</span>
                  </label>
                  <label htmlFor="admin-studio-camera-picker" className="btn-glass-secondary" style={{ cursor: 'pointer' }}>
                    <Camera size={17} />
                    <span>Chụp trực tiếp</span>
                  </label>
                </div>
              </div>

              {/* Quick Samples */}
              <div style={{ marginTop: '18px' }}>
                <div className="quick-samples-title" style={{ marginBottom: '10px' }}>
                  ✦ HOẶC CHỌN MẪU THỰC ĐỊA (TỰ ĐỘNG GỢI Ý TỌA ĐỘ TRÊN BẢN ĐỒ)
                </div>
                <div className="quick-samples-grid">
                  {QUICK_SAMPLES.map((s, idx) => (
                    <div key={idx} className="quick-sample-card" onClick={() => loadQuickSample(s)}>
                      <img src={s.url} alt={s.title} />
                      <div style={{ overflow: 'hidden' }}>
                        <div className="sample-info-title">{s.title}</div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#94a3b8',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                          }}
                        >
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

          {/* VIEW 2: Preview & Run AI Button */}
          {file && !result && (
            <div>
              <div className="diagnostic-stage" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <img src={preview} alt="Ảnh chuẩn bị phân tích" className="diagnostic-stage-img" />

                {loading && (
                  <div className="diagnostic-scan-overlay">
                    <div className="diagnostic-laser-beam" />
                    <div className="diagnostic-telemetry-hud">
                      <Loader2 size={32} className="spin" style={{ color: '#00f2fe', margin: '0 auto 10px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                        YOLO26L-SEG ĐANG PHÂN TÁCH VẬT CẢN...
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#38bdf8', marginTop: '4px' }}>
                        Gắn tọa độ ({latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800 }}>
                    📍 TỌA ĐỘ CỐNG SẼ LƯU VÀO HỆ THỐNG:
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>
                    {locationLabel} ·{' '}
                    <span style={{ color: '#00f2fe', fontFamily: 'monospace' }}>
                      {latitude.toFixed(5)}°N, {longitude.toFixed(5)}°E
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-glow-primary"
                  disabled={loading}
                  onClick={run}
                  style={{ padding: '11px 22px' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Đang phân tích AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Phân tích AI &amp; Ghim lên Bản đồ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: Split-Screen Result Stage */}
          {result && (
            <div>
              <div className="stage-slider-bar" style={{ borderRadius: '12px 12px 0 0' }}>
                <div className="slider-bar-left">
                  <Sparkles size={15} className="text-sky-400" />
                  <span>So sánh thị giác: Ảnh thực địa ↔ AI YOLO26l-Seg</span>
                </div>
                <div className="slider-bar-hint">
                  <span>↔ Kéo thanh trượt laser</span>
                </div>
              </div>

              <div
                ref={resultSliderRef}
                className="diagnostic-stage"
                onMouseMove={e => handleSliderMove(e.clientX)}
                onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
                onClick={e => handleSliderMove(e.clientX)}
                style={{ cursor: 'ew-resize', borderRadius: '0 0 16px 16px' }}
              >
                <img src={preview} alt="Ảnh thực địa gốc" className="stage-img-raw" />
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
                <div className="stage-divider" style={{ left: `${sliderPos}%` }}>
                  <div className="stage-handle">
                    <span>↔</span>
                  </div>
                </div>
                <div className="stage-tag stage-tag-left">📷 Ảnh thực địa gốc</div>
                <div className="stage-tag stage-tag-right">✨ AI YOLO26l-Seg phát hiện vật cản</div>
              </div>

              {/* Result Summary & Gauge */}
              <div style={{ marginTop: '18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: currentBadge.color,
                        background: currentBadge.bg,
                        border: `1px solid ${currentBadge.color}40`,
                      }}
                    >
                      {currentBadge.label}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '6px 0 0' }}>
                      {blockage != null ? `Tắc nghẽn bề mặt: ${blockage}%` : currentBadge.label}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/map?lat=${latitude}&lng=${longitude}`}
                      className="btn-glow-primary"
                      style={{ padding: '9px 16px', fontSize: '13px' }}
                    >
                      <MapPin size={15} />
                      <span>Mở vị trí trên GIS 3D</span>
                      <ArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      className="btn-glass-secondary"
                      onClick={reset}
                      style={{ padding: '9px 14px', fontSize: '13px' }}
                    >
                      <RefreshCw size={14} />
                      <span>Kiểm tra cống tiếp theo</span>
                    </button>
                  </div>
                </div>

                <div className="diagnostic-metrics-grid">
                  <div className="gauge-box-card">
                    <div style={{ position: 'relative', width: '110px', height: '110px' }}>
                      <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="transparent"
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeWidth="8"
                        />
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
                          <b style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>
                            {blockage != null ? `${blockage}%` : '—'}
                          </b>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '9.5px',
                              color: '#94a3b8',
                              textTransform: 'uppercase',
                              marginTop: '2px',
                            }}
                          >
                            Tắc nghẽn
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="telemetry-chips-row">
                    <div className="telemetry-chip">
                      <span>Độ tin cậy AI</span>
                      <b style={{ color: '#38bdf8' }}>
                        {confidence != null ? `${(confidence * 100).toFixed(1)}%` : '—'}
                      </b>
                    </div>
                    <div className="telemetry-chip">
                      <span>Miệng cống</span>
                      <b>{result.result.drain_count} vị trí</b>
                    </div>
                    <div className="telemetry-chip">
                      <span>Tọa độ đã lưu</span>
                      <b style={{ fontSize: '13.5px', color: '#00f2fe', marginTop: '6px', fontFamily: 'monospace' }}>
                        {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
                      </b>
                    </div>
                    <div className="telemetry-chip">
                      <span>Mô hình</span>
                      <b style={{ fontSize: '14px', color: '#a78bfa', marginTop: '6px' }}>YOLO26l-Seg</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive GIS Drain Location Selector */}
        <div className="admin-glass-panel" style={{ padding: '20px', borderColor: 'rgba(0, 242, 254, 0.35)' }}>
          <div className="admin-panel-head" style={{ marginBottom: '12px' }}>
            <div>
              <span className="admin-eyebrow">2. ĐỊNH VỊ TRÊN BẢN ĐỒ GIS</span>
              <h2 className="admin-panel-title">Chọn Vị Trí Của Cống Thoát Nước</h2>
            </div>

            <button
              type="button"
              className="admin-quick-chip"
              onClick={detectStandingGps}
              disabled={gpsLoading}
              title="Lấy tọa độ GPS tại vị trí thiết bị đang đứng"
            >
              {gpsLoading ? <Loader2 size={14} className="spin" /> : <Navigation size={14} className="text-sky-400" />}
              <span>{gpsLoading ? 'Đang dò GPS...' : 'Vị trí đang đứng (GPS)'}</span>
            </button>
          </div>

          {/* Interactive MapLibre Picker */}
          <LocationPickerMap
            latitude={latitude}
            longitude={longitude}
            onChange={(lat, lng) => setCoordinates(lat, lng)}
            height="320px"
          />

          {/* Active Coordinate Readout + Manual Lat/Lng Inputs */}
          <div
            style={{
              marginTop: '14px',
              padding: '12px 14px',
              borderRadius: '14px',
              background: 'rgba(2, 6, 23, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                fontSize: '12px',
              }}
            >
              <span style={{ color: '#94a3b8', fontWeight: 700 }}>ĐỊA ĐIỂM ĐANG CHỌN:</span>
              <b style={{ color: '#38bdf8' }}>{locationLabel}</b>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="cyber-field">
                <label htmlFor="studio-coord-lat">Vĩ độ (Latitude)</label>
                <input
                  id="studio-coord-lat"
                  type="number"
                  step="0.0001"
                  className="cyber-input"
                  value={latInput}
                  onChange={e => {
                    setLatInput(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (Number.isFinite(parsed) && parsed >= -90 && parsed <= 90) {
                      setLatitude(parsed);
                      setLocationLabel('⌨️ Tọa độ nhập thủ công');
                    }
                  }}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="studio-coord-lng">Kinh độ (Longitude)</label>
                <input
                  id="studio-coord-lng"
                  type="number"
                  step="0.0001"
                  className="cyber-input"
                  value={lngInput}
                  onChange={e => {
                    setLngInput(e.target.value);
                    const parsed = parseFloat(e.target.value);
                    if (Number.isFinite(parsed) && parsed >= -180 && parsed <= 180) {
                      setLongitude(parsed);
                      setLocationLabel('⌨️ Tọa độ nhập thủ công');
                    }
                  }}
                />
              </div>
            </div>

            {/* If result already exists, allow instant re-assigning location */}
            {result?.analysis_id && (
              <button
                type="button"
                className="btn-glow-primary"
                onClick={updateExistingRecordLocation}
                disabled={updatingLoc}
                style={{ width: '100%', marginTop: '12px', justifyContent: 'center', padding: '10px' }}
              >
                {updatingLoc ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Đang cập nhật vị trí cống...</span>
                  </>
                ) : (
                  <>
                    <Crosshair size={15} />
                    <span>
                      Cập nhật tọa độ mới cho Miệng cống #{result.analysis_id} ({latitude.toFixed(4)}°N,{' '}
                      {longitude.toFixed(4)}°E)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Location Presets */}
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#38bdf8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Compass size={14} />
              <span>CHỌN NHANH ĐIỂM THU NƯỚC TRỌNG ĐIỂM (ĐH VKU &amp; ĐÀ NẴNG)</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
                gap: '8px',
              }}
            >
              {LOCATION_PRESETS.map(p => {
                const isSelected =
                  Math.abs(latitude - p.lat) < 0.0002 && Math.abs(longitude - p.lng) < 0.0002;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setCoordinates(p.lat, p.lng, p.name)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 11px',
                      borderRadius: '11px',
                      background: isSelected ? 'rgba(0, 242, 254, 0.16)' : 'rgba(15, 23, 42, 0.65)',
                      border: isSelected
                        ? '1px solid rgba(0, 242, 254, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                  >
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff' }}>{p.name}</div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>{p.area}</div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#00f2fe',
                        fontFamily: 'monospace',
                        marginTop: '3px',
                      }}
                    >
                      {p.lat.toFixed(4)}°N, {p.lng.toFixed(4)}°E
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
