'use client';

import { useState, useRef, type MouseEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Camera,
  Cpu,
  Layers,
  Map as MapIcon,
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 0,
    title: 'Hải Châu · Hùng Vương',
    tag: 'Báo động cấp 4 · 78%',
    dotColor: '#ef4444',
    rawImg: '/demo/drain-sample-2.jpg',
    annotatedImg: '/demo/drain-annotated-2.jpg',
    blockage: '78%',
    debris: '5 vị trí rác túi nilon lớn',
    risk: 'BÁO ĐỘNG ĐỎ',
    riskColor: '#ef4444',
    latency: '36ms',
    gps: '16.0682° N, 108.2195° E',
  },
  {
    id: 1,
    title: 'Thanh Khê · Lê Duẩn',
    tag: 'Cảnh báo cấp 2 · 41%',
    dotColor: '#f59e0b',
    rawImg: '/demo/drain-raw.jpg',
    annotatedImg: '/demo/drain-annotated.jpg',
    blockage: '41%',
    debris: '7 điểm lá cây & bùn cát',
    risk: 'CÓ NGUY CƠ',
    riskColor: '#f59e0b',
    latency: '38ms',
    gps: '16.0694° N, 108.2120° E',
  },
  {
    id: 2,
    title: 'Hải Châu · Chợ Cồn',
    tag: 'Nguy cơ cao · 64%',
    dotColor: '#f97316',
    rawImg: '/demo/drain-sample-4.jpg',
    annotatedImg: '/demo/drain-annotated-4.jpg',
    blockage: '64%',
    debris: '4 túi rác sinh hoạt',
    risk: 'NGUY HIỂM',
    riskColor: '#f97316',
    latency: '34ms',
    gps: '16.0621° N, 108.2155° E',
  },
  {
    id: 3,
    title: 'Sơn Trà · Bạch Đằng',
    tag: 'Đã thông thoát · 0%',
    dotColor: '#10b981',
    rawImg: '/demo/drain-sample-5.jpg',
    annotatedImg: '/demo/drain-annotated-5.jpg',
    blockage: '0%',
    debris: 'Mặt lưới thông thoáng',
    risk: 'AN TOÀN',
    riskColor: '#10b981',
    latency: '31ms',
    gps: '16.0715° N, 108.2241° E',
  },
];

const RADAR_PINS = [
  {
    id: 1,
    top: '48%',
    left: '52%',
    name: 'Cầu Rồng · Bạch Đằng',
    status: 'Tắc 78% · Rác sinh hoạt',
    riskColor: '#ef4444',
    thumb: '/demo/drain-annotated-2.jpg',
    scenarioIdx: 0,
  },
  {
    id: 2,
    top: '38%',
    left: '36%',
    name: 'Lê Duẩn · Ngã 3 Minh Khai',
    status: 'Tắc 41% · Cành lá cây',
    riskColor: '#f59e0b',
    thumb: '/demo/drain-annotated.jpg',
    scenarioIdx: 1,
  },
  {
    id: 3,
    top: '44%',
    left: '42%',
    name: 'Hùng Vương · Chợ Cồn',
    status: 'Tắc 64% · Bọc nilon',
    riskColor: '#f97316',
    thumb: '/demo/drain-annotated-4.jpg',
    scenarioIdx: 2,
  },
  {
    id: 4,
    top: '56%',
    left: '70%',
    name: 'Võ Văn Kiệt · Biển Mỹ Khê',
    status: 'Tắc 12% · Cát ven biển',
    riskColor: '#10b981',
    thumb: '/demo/drain-annotated-5.jpg',
    scenarioIdx: 3,
  },
  {
    id: 5,
    top: '26%',
    left: '58%',
    name: 'Bạch Đằng · Cầu Sông Hàn',
    status: 'Thông thoáng 0%',
    riskColor: '#38bdf8',
    thumb: '/demo/drain-sample-5.jpg',
    scenarioIdx: 3,
  },
];

const MARQUEE_ITEMS = [
  { img: '/demo/drain-sample-2.jpg', tag: 'Thực địa', sub: 'Hùng Vương', color: '#94a3b8' },
  { img: '/demo/drain-annotated-2.jpg', tag: 'Tắc 78%', sub: 'Báo động', color: '#ef4444' },
  { img: '/demo/drain-raw.jpg', tag: 'Thực địa', sub: 'Lê Duẩn', color: '#94a3b8' },
  { img: '/demo/drain-annotated.jpg', tag: 'Tắc 41%', sub: 'Lá cây', color: '#f59e0b' },
  { img: '/demo/drain-sample-4.jpg', tag: 'Thực địa', sub: 'Nguyễn Văn Linh', color: '#94a3b8' },
  { img: '/demo/drain-annotated-4.jpg', tag: 'Tắc 64%', sub: 'Bọc nilon', color: '#f97316' },
  { img: '/demo/drain-sample-5.jpg', tag: 'Thực địa', sub: 'Bạch Đằng', color: '#94a3b8' },
  { img: '/demo/drain-annotated-5.jpg', tag: 'Thông thoáng', sub: 'An toàn 0%', color: '#10b981' },
];

export default function Home() {
  const [sliderPos, setSliderPos] = useState(50);
  const [activeScenario, setActiveScenario] = useState(0);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const current = SCENARIOS[activeScenario];

  function handleMove(clientX: number) {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    handleMove(e.clientX);
  }

  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    handleMove(e.touches[0].clientX);
  }

  return (
    <div className="visual-space-home">
      {/* 1. Ambient Lighting & Space Coordinates */}
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      {/* 2. Hero Section (Zero Boxed Cards) */}
      <section className="hero-visual-wrap">
        <div className="hero-pill-indicator">
          <span className="radar-ping-dot" />
          <span>HỆ THỐNG GIÁM SÁT THỦY VĂN ĐÔ THỊ · AI & GIS 2026</span>
        </div>

        <h1 className="hero-punchy-title">
          Thấu thị dòng chảy ngầm.<br />
          <span className="title-glow-cyan">Chấm dứt ngập lụt đô thị.</span>
        </h1>

        <p style={{ color: '#94a3b8', fontSize: '16px', maxWidth: '640px', margin: '0 auto 24px', lineHeight: 1.5 }}>
          Thị giác máy tính YOLOv11 phát hiện rác bít tắc trong 38ms &amp; lập bản đồ cảnh báo ngập lụt thời gian thực.
        </p>

        <div className="hero-actions-row">
          <Link href="/analyze" className="btn-glow-primary">
            <Camera size={18} />
            <span>Chụp ảnh kiểm tra ngay</span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/map" className="btn-glass-secondary">
            <MapIcon size={18} />
            <span>Bản đồ giám sát GIS 3D</span>
          </Link>
        </div>

        {/* 3. Interactive Before/After Split-Screen Stage */}
        <div className="stage-slider-frame">
          <div className="stage-slider-bar">
            <div className="slider-bar-left">
              <Cpu size={15} className="text-sky-400" />
              <span>YOLOv11x-Seg · {current.title}</span>
            </div>
            <div className="slider-bar-hint">
              <span>↔ Rê chuột hoặc chạm để so sánh thực địa</span>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="stage-slider-viewport"
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onClick={e => handleMove(e.clientX)}
          >
            {/* Raw Street Photo */}
            <img
              src={current.rawImg}
              alt="Ảnh thực địa nguyên bản"
              className="stage-img-raw"
            />

            {/* AI Annotated Photo with Dynamic Polygon Clip Path */}
            <div
              className="stage-img-overlay-clip"
              style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
            >
              <img
                src={current.annotatedImg}
                alt="Ảnh AI phân tách vật cản"
                className="stage-img-annotated"
              />
            </div>

            {/* Glowing Laser Divider */}
            <div
              className="stage-divider"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="stage-handle">
                <span>↔</span>
              </div>
            </div>

            {/* Side Badges */}
            <div className="stage-tag stage-tag-left">
              📷 Thực địa nguyên bản
            </div>
            <div className="stage-tag stage-tag-right">
              ✨ AI YOLOv11 phát hiện rác
            </div>

            {/* Floating Glass HUD Bar Inside Stage */}
            <div className="stage-hud-overlay">
              <div className="stage-hud-group">
                <div className="stage-hud-item">
                  <b style={{ color: current.riskColor }}>{current.risk} ({current.blockage})</b>
                  <span>Mức độ bít tắc</span>
                </div>
                <div className="stage-hud-item">
                  <b>{current.debris}</b>
                  <span>Vật cản nhận diện</span>
                </div>
                <div className="stage-hud-item">
                  <b style={{ color: '#38bdf8' }}>{current.latency}</b>
                  <span>Độ trễ suy luận</span>
                </div>
              </div>
              <div className="stage-hud-item" style={{ textAlign: 'right' }}>
                <b>{current.gps}</b>
                <span>Tọa độ thực địa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Scenario Selector Pills */}
        <div className="stage-scenario-pills">
          {SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              className={`scenario-pill-btn ${activeScenario === idx ? 'active' : ''}`}
              onClick={() => setActiveScenario(idx)}
            >
              <span className="scenario-pill-dot" style={{ background: sc.dotColor }} />
              <span>{sc.title}</span>
              <span style={{ opacity: 0.7, fontSize: '11px' }}>({sc.blockage})</span>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 2: 360° SATELLITE RADAR SCREEN */}
      <section className="radar-section-wrap">
        <div className="radar-screen-card">
          {/* Danang High-Resolution Optical Satellite Backdrop */}
          <img
            src="/demo/satellite-danang-radar.jpg"
            alt="Vệ tinh Đà Nẵng 360 độ"
            className="radar-backdrop-img"
          />

          {/* 360° Animated Laser Radar Sweep Cone */}
          <div className="radar-sweep-center">
            <div className="radar-concentric-1" />
            <div className="radar-concentric-2" />
            <div className="radar-sweep-cone" />
          </div>

          {/* Top-Left Floating Radar Badge */}
          <div className="radar-header-overlay">
            <div className="radar-title-badge">
              <span className="radar-ping-dot" />
              <span>QUAN SÁT THỰC ĐỊA · TRUNG TÂM ĐÀ NẴNG</span>
            </div>
          </div>

          {/* Bottom-Right Floating Fullscreen Button */}
          <div className="radar-action-overlay">
            <Link href="/map" className="btn-glow-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>
              <span>Mở bản đồ GIS 1,280+ miệng thu</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Interactive Radar Hotspot Pings */}
          {RADAR_PINS.map(pin => (
            <div
              key={pin.id}
              className={`radar-hotspot-pin ${hoveredPin === pin.id ? 'is-active' : ''}`}
              style={{ top: pin.top, left: pin.left }}
              onMouseEnter={() => setHoveredPin(pin.id)}
              onMouseLeave={() => setHoveredPin(null)}
              onClick={() => setActiveScenario(pin.scenarioIdx)}
            >
              <div className="pin-core" style={{ color: pin.riskColor, background: pin.riskColor }} />
              <div className="pin-wave-ring" style={{ color: pin.riskColor }} />

              {/* Floating Tooltip Card with Photo Thumbnail */}
              <div className="pin-tooltip-card">
                <img src={pin.thumb} alt={pin.name} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>{pin.name}</div>
                  <div style={{ fontSize: '11px', color: pin.riskColor, fontWeight: 700 }}>{pin.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: INFINITE PHOTO MARQUEE (Visual Filmstrip) */}
      <section className="photo-marquee-wrap">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#38bdf8', textTransform: 'uppercase' }}>
            HÌNH ẢNH HIỆN TRƯỜNG THỰC TẾ
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            Dữ liệu thị giác kiểm định trực tiếp từ đường phố
          </div>
        </div>

        <div className="photo-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <Link
              key={idx}
              href="/analyze"
              className="marquee-photo-card"
            >
              <img src={item.img} alt={item.sub} />
              <div className="marquee-card-badge">
                <span style={{ color: item.color }}>● {item.tag}</span>
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: PURE VISUAL FLOW PIPELINE (Zero paragraph boxes) */}
      <section className="visual-workflow-wrap">
        <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', color: '#38bdf8', textTransform: 'uppercase' }}>
          QUY TRÌNH TỐI GIẢN
        </div>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', marginTop: '6px', letterSpacing: '-0.02em' }}>
          Từ bức ảnh hiện trường đến điều phối nạo vét
        </div>

        <div className="workflow-nodes-row">
          <div className="workflow-node">
            <div className="workflow-icon-bubble">
              <Camera size={32} />
            </div>
            <div className="workflow-label">1. Chụp Hiện Trường</div>
            <div className="workflow-sub">1 chạm từ smartphone</div>
          </div>

          <div className="workflow-node">
            <div className="workflow-icon-bubble" style={{ borderColor: '#38bdf8', color: '#38bdf8' }}>
              <Cpu size={32} />
            </div>
            <div className="workflow-label">2. YOLOv11 AI</div>
            <div className="workflow-sub">Phân tách vật cản trong 38ms</div>
          </div>

          <div className="workflow-node">
            <div className="workflow-icon-bubble" style={{ borderColor: '#10b981', color: '#10b981' }}>
              <Layers size={32} />
            </div>
            <div className="workflow-label">3. Bản Đồ GIS 3D</div>
            <div className="workflow-sub">Định vị &amp; điều phối ứng cứu</div>
          </div>
        </div>
      </section>

      {/* SECTION 5: MINIMAL AURORA CTA BANNER */}
      <section className="minimal-cta-wrap">
        <div className="minimal-cta-box">
          <h2 className="minimal-cta-title">
            Bảo vệ đô thị trước mọi cơn bão.
          </h2>
          <p className="minimal-cta-sub">
            Chỉ cần 1 bức ảnh chụp từ hiện trường để ngăn chặn kịp thời những trận ngập úng đô thị cục bộ.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/analyze" className="btn-glow-primary">
              <Camera size={18} />
              <span>Chụp ảnh phân tích ngay</span>
              <ArrowRight size={16} />
            </Link>
            <Link href="/map" className="btn-glass-secondary">
              <MapIcon size={18} />
              <span>Khám phá bản đồ GIS</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
