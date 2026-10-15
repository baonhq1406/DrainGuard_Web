'use client';

import { useState, useRef, useEffect, type MouseEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Camera,
  Cpu,
  Map as MapIcon,
  Radar,
  Sparkles,
  Zap,
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
    debris: '5 túi nilon lớn',
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
    debris: '7 điểm lá cây & bùn',
    risk: 'CẢNH BÁO',
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
    debris: '4 bọc rác sinh hoạt',
    risk: 'TẮC NHIỀU',
    riskColor: '#f97316',
    latency: '34ms',
    gps: '16.0621° N, 108.2155° E',
  },
  {
    id: 3,
    title: 'Sơn Trà · Bạch Đằng',
    tag: 'Thông thoáng · 0%',
    dotColor: '#10b981',
    rawImg: '/demo/drain-sample-5.jpg',
    annotatedImg: '/demo/drain-annotated-5.jpg',
    blockage: '0%',
    debris: 'Mặt lưới sạch',
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
  { img: '/demo/drain-sample-2.jpg', tag: 'RAW', sub: 'Hùng Vương', color: '#94a3b8' },
  { img: '/demo/drain-annotated-2.jpg', tag: '78% TẮC', sub: 'Báo động đỏ', color: '#ef4444' },
  { img: '/demo/drain-raw.jpg', tag: 'RAW', sub: 'Lê Duẩn', color: '#94a3b8' },
  { img: '/demo/drain-annotated.jpg', tag: '41% TẮC', sub: 'Lá cây', color: '#f59e0b' },
  { img: '/demo/drain-sample-4.jpg', tag: 'RAW', sub: 'Chợ Cồn', color: '#94a3b8' },
  { img: '/demo/drain-annotated-4.jpg', tag: '64% TẮC', sub: 'Bọc nilon', color: '#f97316' },
  { img: '/demo/drain-sample-5.jpg', tag: 'RAW', sub: 'Bạch Đằng', color: '#94a3b8' },
  { img: '/demo/drain-annotated-5.jpg', tag: '0% SẠCH', sub: 'An toàn', color: '#10b981' },
];

const VISUAL_PORTALS = [
  {
    step: '01',
    badge: 'OPTICAL CAPTURE',
    title: 'Quét Hiện Trường',
    metric: '1 Chạm · Tự động GPS',
    img: '/demo/drain-sample-2.jpg',
    color: '#38bdf8',
    mode: 'reticle',
    href: '/analyze',
  },
  {
    step: '02',
    badge: 'YOLOv11-SEG VISION',
    title: 'Bóc Tách Vật Cản',
    metric: '38ms · Chính xác 99.2%',
    img: '/demo/drain-annotated-2.jpg',
    color: '#f97316',
    mode: 'laser',
    href: '/analyze',
  },
  {
    step: '03',
    badge: 'REALTIME GIS 3D',
    title: 'Điều Phối Ứng Cứu',
    metric: '1,280+ Trạm Đà Nẵng',
    img: '/demo/satellite-danang-radar.jpg',
    color: '#10b981',
    mode: 'sonar',
    href: '/map',
  },
];

export default function Home() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeScenario, setActiveScenario] = useState(0);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const current = SCENARIOS[activeScenario];

  // Auto-oscillating laser scanner when user is not hovering/dragging
  useEffect(() => {
    if (isInteracting) return;
    let frameId: number;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const nextPos = 50 + Math.sin(elapsed * 1.35) * 32;
      setSliderPos(nextPos);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isInteracting]);

  function handleMove(clientX: number) {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    setIsInteracting(true);
    handleMove(e.clientX);
  }

  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    setIsInteracting(true);
    handleMove(e.touches[0].clientX);
  }

  return (
    <div className="visual-space-home">
      {/* Ambient Lighting & Space Coordinates */}
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      {/* SECTION 1: HERO & AUTO-SCANNING SPLIT STAGE */}
      <section className="hero-visual-wrap">
        <div className="hero-pill-indicator">
          <span className="radar-ping-dot" />
          <span>AI HYDROLOGY VISION · ĐÀ NẴNG 2026</span>
        </div>

        <h1 className="hero-punchy-title">
          Thấu thị dòng chảy ngầm.<br />
          <span className="title-glow-cyan">Chấm dứt ngập lụt đô thị.</span>
        </h1>

        {/* Ultra-Minimal Live Telemetry Pills instead of long paragraph */}
        <div className="hero-telemetry-chips">
          <div className="hero-telemetry-pill">
            <Zap size={14} className="text-sky-400" />
            <span><b>38ms</b> YOLOv11-Seg</span>
          </div>
          <div className="hero-telemetry-pill">
            <Radar size={14} className="text-emerald-400" />
            <span><b>1,280+</b> Trạm GIS</span>
          </div>
          <div className="hero-telemetry-pill">
            <Sparkles size={14} className="text-amber-400" />
            <span><b>99.2%</b> Độ chính xác</span>
          </div>
        </div>

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

        {/* Interactive Before/After Split-Screen Stage */}
        <div className="stage-slider-frame">
          <div className="stage-slider-bar">
            <div className="slider-bar-left">
              <Cpu size={15} className="text-sky-400 spin-slow" />
              <span>YOLOv11x-Seg · {current.title}</span>
            </div>
            <div className="slider-bar-hint">
              <span className="pulse-text-cyan">
                {isInteracting ? '↔ Đang điều khiển thủ công' : '⚡ Quét tự động · Chạm để kéo'}
              </span>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="stage-slider-viewport"
            onMouseEnter={() => setIsInteracting(true)}
            onMouseLeave={() => setIsInteracting(false)}
            onMouseMove={onMouseMove}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setIsInteracting(false)}
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
              {/* Subtle Horizontal Laser Sweep inside AI Zone */}
              <div className="ai-zone-scanline" />
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
              📷 Thực địa RAW
            </div>
            <div className="stage-tag stage-tag-right">
              ✨ AI Segmentation
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
                  <span>Vật cản AI</span>
                </div>
                <div className="stage-hud-item">
                  <b style={{ color: '#38bdf8' }}>{current.latency}</b>
                  <span>Tốc độ xử lý</span>
                </div>
              </div>
              <div className="stage-hud-item" style={{ textAlign: 'right' }}>
                <b>{current.gps}</b>
                <span>Tọa độ GPS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Scenario Selector Pills with Real Mini Previews */}
        <div className="stage-scenario-pills">
          {SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              className={`scenario-pill-btn ${activeScenario === idx ? 'active' : ''}`}
              onClick={() => setActiveScenario(idx)}
            >
              <img src={sc.annotatedImg} alt={sc.title} className="scenario-pill-thumb" />
              <span>{sc.title}</span>
              <span className="scenario-pill-pct" style={{ color: sc.dotColor }}>{sc.blockage}</span>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 2: 360° SATELLITE RADAR SCREEN */}
      <section className="radar-section-wrap">
        <div className="radar-screen-card">
          <img
            src="/demo/satellite-danang-radar.jpg"
            alt="Vệ tinh Đà Nẵng 360 độ"
            className="radar-backdrop-img"
          />

          <div className="radar-sweep-center">
            <div className="radar-concentric-1" />
            <div className="radar-concentric-2" />
            <div className="radar-sweep-cone" />
          </div>

          <div className="radar-header-overlay">
            <div className="radar-title-badge">
              <span className="radar-ping-dot" />
              <span>RADAR VỆ TINH THỜI GIAN THỰC · ĐÀ NẴNG</span>
            </div>
          </div>

          <div className="radar-action-overlay">
            <Link href="/map" className="btn-glow-primary" style={{ padding: '10px 18px', fontSize: '13px' }}>
              <span>Mở bản đồ GIS 3D</span>
              <ArrowRight size={14} />
            </Link>
          </div>

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
        <div className="marquee-header-minimal">
          <span className="marquee-live-pill">
            <Activity size={13} className="text-sky-400" />
            <span>LIVE OPTICAL STREAM · HIỆN TRƯỜNG ĐƯỜNG PHỐ</span>
          </span>
        </div>

        <div className="photo-marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <Link
              key={idx}
              href="/analyze"
              className="marquee-photo-card"
            >
              <img src={item.img} alt={item.sub} />
              <div className="marquee-hover-scan" />
              <div className="marquee-card-badge">
                <span style={{ color: item.color }}>● {item.tag}</span>
                <span style={{ color: '#e2e8f0', fontSize: '11px' }}>{item.sub}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 4: 3 HOLOGRAPHIC PHOTO PORTALS WITH ANIMATED LASER CONDUITS */}
      <section className="hologram-portals-section">
        <div className="portals-header">
          <span className="portals-eyebrow">PIPELINE TỰ ĐỘNG HÓA 100%</span>
          <h2 className="portals-title">3 Bước Thị Giác Thời Gian Thực</h2>
        </div>

        <div className="hologram-portals-grid">
          {VISUAL_PORTALS.map((portal, idx) => (
            <Link
              key={portal.step}
              href={portal.href}
              className="hologram-portal-card"
              style={{ '--portal-color': portal.color } as React.CSSProperties}
            >
              <div className="portal-image-stage">
                <img src={portal.img} alt={portal.title} />

                {/* Animated Overlay Specific to Each Step */}
                {portal.mode === 'reticle' && (
                  <div className="portal-fx-reticle">
                    <span className="reticle-corner tl" />
                    <span className="reticle-corner tr" />
                    <span className="reticle-corner bl" />
                    <span className="reticle-corner br" />
                    <div className="reticle-center-ring" />
                  </div>
                )}

                {portal.mode === 'laser' && (
                  <div className="portal-fx-laser">
                    <div className="portal-laser-beam" />
                    <div className="portal-bbox-pulse" />
                  </div>
                )}

                {portal.mode === 'sonar' && (
                  <div className="portal-fx-sonar">
                    <div className="sonar-ring r1" />
                    <div className="sonar-ring r2" />
                    <div className="sonar-dot" />
                  </div>
                )}

                <div className="portal-step-chip" style={{ borderColor: portal.color, color: portal.color }}>
                  STEP {portal.step}
                </div>
                <div className="portal-metric-badge">
                  <span>{portal.metric}</span>
                </div>
              </div>

              <div className="portal-card-footer">
                <div>
                  <div className="portal-badge-mini" style={{ color: portal.color }}>{portal.badge}</div>
                  <div className="portal-card-title">{portal.title}</div>
                </div>
                <div className="portal-arrow-circle">
                  <ArrowRight size={16} />
                </div>
              </div>

              {/* Animated Energy Conduit between portals on desktop */}
              {idx < VISUAL_PORTALS.length - 1 && (
                <div className="portal-energy-conduit" aria-hidden="true">
                  <div className="conduit-pulse" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* SECTION 5: IMMERSIVE VISUAL MOSAIC PORTAL BANNER */}
      <section className="visual-portal-cta-wrap">
        <div className="visual-portal-cta-card">
          {/* Dual Visual Background Mosaic */}
          <div className="cta-mosaic-bg">
            <img src="/demo/satellite-danang-radar.jpg" alt="" className="cta-bg-left" />
            <img src="/demo/drain-annotated-2.jpg" alt="" className="cta-bg-right" />
            <div className="cta-mosaic-overlay" />
            <div className="cta-cyber-scanline" />
          </div>

          <div className="cta-portal-content">
            <div className="cta-live-tag">
              <span className="radar-ping-dot" />
              <span>TRỰC TUYẾN 24/7 · SẴN SÀNG PHÂN TÍCH</span>
            </div>

            <h2 className="cta-portal-headline">
              1 Chạm. <span className="title-glow-cyan">Bảo Vệ Đô Thị.</span>
            </h2>

            <div className="cta-portal-actions">
              <Link href="/analyze" className="btn-glow-primary">
                <Camera size={18} />
                <span>Chụp ảnh phân tích ngay</span>
                <ArrowRight size={16} />
              </Link>
              <Link href="/map" className="btn-glass-secondary">
                <MapIcon size={18} />
                <span>Mở bản đồ GIS 3D</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
