'use client';

import { useState, useRef, type MouseEvent, type TouchEvent } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Camera,
  Compass,
  Cpu,
  Layers,
  Map as MapIcon,
  Maximize2,
  Scan,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Home() {
  // Real Interactive Split-Screen Slider Position (0 to 100%)
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeScenario, setActiveScenario] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scenarios = [
    {
      id: 0,
      title: 'Đường Hùng Vương - Bọc rác sinh hoạt lớn',
      badge: 'Báo động cấp 4 · Tắc 78%',
      rawImg: '/demo/drain-sample-2.jpg',
      annotatedImg: '/demo/drain-annotated-2.jpg',
      blockage: '78%',
      debrisCount: '5 vị trí rác',
      riskLevel: 'NGUY HIỂM',
      riskColor: '#ef4444',
      latency: '36ms',
    },
    {
      id: 1,
      title: 'Đường Lê Duẩn - Lá cây & rác che phủ mặt lưới',
      badge: 'Cảnh báo cấp 2 · Tắc 41%',
      rawImg: '/demo/drain-raw.jpg',
      annotatedImg: '/demo/drain-annotated.jpg',
      blockage: '41%',
      debrisCount: '7 điểm rác & lá',
      riskLevel: 'CÓ NGUY CƠ',
      riskColor: '#f59e0b',
      latency: '38ms',
    },
  ];

  const current = scenarios[activeScenario];

  // Handle Dragging
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
    <div className="deep-space-home">
      {/* 1. Ambient Backdrop Glow & Space Coordinate Grid */}
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      {/* 2. Hero Section */}
      <section className="space-hero-section">
        <div className="space-status-badge">
          <span className="radar-ping-ring" />
          <span>HỆ THỐNG GIÁM SÁT ĐÔ THỊ THÔNG MINH · AI & GIS 2026</span>
        </div>

        <h1 className="space-hero-heading">
          Thấu thị lòng đô thị. <br />
          <span className="heading-gradient-glow">Chấm dứt nỗi lo ngập úng.</span>
        </h1>

        <p className="space-hero-lead">
          Nền tảng ứng dụng Thị giác Máy tính YOLOv11 phân tách rác thải, tự động đo lường độ bít tắc miệng thu
          và lập bản đồ thủy văn cảnh báo ngập lụt theo thời gian thực.
        </p>

        <div className="space-hero-actions">
          <Link href="/analyze" className="btn-space-primary">
            <Camera size={19} />
            <span>Chụp ảnh kiểm tra ngay</span>
          </Link>
          <Link href="/map" className="btn-space-glass">
            <MapIcon size={19} />
            <span>Bản đồ giám sát GIS 3D</span>
          </Link>
        </div>

        {/* 3. Real Interactive Before/After Split-Screen Slider */}
        <div className="spatial-slider-container">
          <div className="slider-top-toolbar">
            <div className="toolbar-device-pill">
              <Cpu size={16} className="text-sky-400" />
              <span>YOLOv11x-Seg · Phân tích thị giác trực tiếp tại hiện trường</span>
            </div>
            <div className="toolbar-instruction">
              <span>↔ Kéo rê chuột để so sánh Thực địa vs AI</span>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="slider-stage"
            onMouseMove={onMouseMove}
            onTouchMove={onTouchMove}
            onClick={e => handleMove(e.clientX)}
          >
            {/* Base Image (Real Raw Street Photo) */}
            <img
              src={current.rawImg}
              alt="Ảnh thực địa nguyên bản"
              className="slider-img-base"
            />

            {/* Overlay Image (AI Annotated with Dynamic Clip Path) */}
            <div
              className="slider-img-overlay-wrap"
              style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
            >
              <img
                src={current.annotatedImg}
                alt="Ảnh AI phân tích"
                className="slider-img-overlay"
              />
            </div>

            {/* Glowing Divider Line */}
            <div
              className="slider-divider-line"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="slider-handle-thumb">
                <span>↔</span>
              </div>
            </div>

            {/* Side Badges */}
            <div className="slider-label-pill label-left">
              📷 Thực địa nguyên bản
            </div>
            <div className="slider-label-pill label-right">
              ✨ AI YOLOv11 phát hiện rác
            </div>

            {/* Bottom HUD Bar */}
            <div className="slider-bottom-hud">
              <div className="hud-stat-group">
                <div className="hud-stat-item">
                  <b style={{ color: current.riskColor }}>{current.riskLevel} ({current.blockage})</b>
                  <span>Mức độ bít tắc</span>
                </div>
                <div className="hud-stat-item">
                  <b>{current.debrisCount}</b>
                  <span>Vật thể phát hiện</span>
                </div>
                <div className="hud-stat-item">
                  <b style={{ color: '#38bdf8' }}>{current.latency}</b>
                  <span>Độ trễ xử lý</span>
                </div>
              </div>
              <div className="hud-stat-item" style={{ textAlign: 'right' }}>
                <b>16.0678° N, 108.2208° E</b>
                <span>Tọa độ thực địa</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Telemetry Metric Ticker */}
      <section className="telemetry-ticker-bar">
        <div className="telemetry-ticker-inner">
          <div className="telemetry-metric-box">
            <span className="telemetry-num">38ms</span>
            <span className="telemetry-label">Tốc độ suy luận AI thời gian thực</span>
          </div>
          <div className="telemetry-metric-box">
            <span className="telemetry-num">98.6%</span>
            <span className="telemetry-label">Độ chính xác phân tách rác & cành cây</span>
          </div>
          <div className="telemetry-metric-box">
            <span className="telemetry-num">1,284+</span>
            <span className="telemetry-label">Miệng thu nước đã số hóa GIS</span>
          </div>
          <div className="telemetry-metric-box">
            <span className="telemetry-num">0%</span>
            <span className="telemetry-label">Điểm mù ngập úng nhờ dữ liệu mở</span>
          </div>
        </div>
      </section>

      {/* 5. Deep Space Bento Grid Showcase */}
      <section className="space-bento-section">
        <div className="space-section-header">
          <div className="space-section-eyebrow">HỆ SINH THÁI GIÁM SÁT TOÀN DIỆN</div>
          <h2 className="space-section-title">Kiến trúc cho Trung tâm Điều hành Thông minh</h2>
        </div>

        <div className="space-bento-grid">
          {/* Card 1: GIS 3D Realtime Map (Span 8) */}
          <Link href="/map" className="space-bento-card space-col-8">
            <span className="space-card-tag">
              <Layers size={13} /> BẢN ĐỒ KHÔNG GIAN ĐỊA LÝ 3D
            </span>
            <h3 className="space-card-title">Bản đồ Giám sát Ngập lụt Đô thị</h3>
            <p className="space-card-desc">
              Tích hợp ảnh vệ tinh thực địa độ nét cao và bản đồ vector thế hệ mới. Hiển thị tọa độ chính xác của từng miệng thu nước, bán kính nguy cơ ngập lụt và trạng thái thông thoáng theo thời gian thực.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
              borderRadius: '16px',
              overflow: 'hidden',
              marginTop: 'auto',
              marginBottom: '16px',
            }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
                <img src="/demo/drain-annotated-2.jpg" alt="Điểm nóng 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'rgba(3,7,18,0.85)', fontSize: '11px', fontWeight: 700 }}>
                  📍 Hải Châu · Nguy cơ cao (78%)
                </div>
              </div>
              <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden' }}>
                <img src="/demo/drain-annotated.jpg" alt="Điểm nóng 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px', background: 'rgba(3,7,18,0.85)', fontSize: '11px', fontWeight: 700 }}>
                  📍 Thanh Khê · Có nguy cơ (41%)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '14px' }}>
              <span>Mở bản đồ điều hành GIS toàn màn hình</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          {/* Card 2: AI Speed & Processing (Span 4) */}
          <div className="space-bento-card space-col-4">
            <span className="space-card-tag">
              <Zap size={13} /> SỨC MẠNH TÍNH TOÁN
            </span>
            <h3 className="space-card-title">Xử lý Ngay tại Hiện trường</h3>
            <p className="space-card-desc">
              Mô hình YOLOv11x-Seg chạy trực tiếp trên GPU/NPU di động, xử lý ảnh độ phân giải cao chỉ trong tích tắc.
            </p>
            <div style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#38bdf8',
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginTop: 'auto',
            }}>
              38ms
            </div>
            <span style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '8px', fontWeight: 600 }}>
              Không cần đường truyền mạng tốc độ cao
            </span>
          </div>

          {/* Card 3: Visual Risk Gauge (Span 4) */}
          <div className="space-bento-card space-col-4">
            <span className="space-card-tag">
              <Activity size={13} /> PHÂN CẤP NGUY CƠ
            </span>
            <h3 className="space-card-title">Ước tính Diện tích Bít tắc</h3>
            <p className="space-card-desc">
              Thuật toán tự động tính phần trăm diện tích miệng cống bị rác thải che lấp để phân loại mức độ ưu tiên nạo vét.
            </p>

            <div className="space-gauge-track">
              <div className="space-gauge-fill" />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontWeight: 750,
              color: '#94a3b8',
              marginTop: '10px',
            }}>
              <span style={{ color: '#10b981' }}>Thông thoáng</span>
              <span style={{ color: '#f59e0b' }}>Có nguy cơ</span>
              <span style={{ color: '#f97316' }}>Tắc nhiều</span>
              <span style={{ color: '#ef4444' }}>Nguy hiểm</span>
            </div>
          </div>

          {/* Card 4: Interactive Scenario Switcher (Span 8) */}
          <div className="space-bento-card space-col-8">
            <span className="space-card-tag">
              <Scan size={13} /> PHÒNG THÍ NGHIỆM TRỰC QUAN
            </span>
            <h3 className="space-card-title">Chọn kịch bản thực tế để quan sát</h3>
            <p className="space-card-desc">
              Nhấp vào một trong các kịch bản thực địa dưới đây để thay đổi trực tiếp màn hình thanh trượt phía trên.
            </p>

            <div className="scenario-selector-grid">
              {scenarios.map((sc, idx) => (
                <div
                  key={sc.id}
                  className={`scenario-card-item ${activeScenario === idx ? 'is-selected' : ''}`}
                  onClick={() => setActiveScenario(idx)}
                >
                  <img src={sc.annotatedImg} alt={sc.title} />
                  <span className="scenario-card-badge">{sc.badge}</span>
                </div>
              ))}
              <Link
                href="/analyze"
                className="scenario-card-item"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(56, 189, 248, 0.08)',
                  color: '#38bdf8',
                  border: '2px dashed rgba(56, 189, 248, 0.3)',
                  textDecoration: 'none',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <Camera size={26} style={{ margin: '0 auto 8px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, display: 'block' }}>Tải ảnh của bạn</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Enterprise Bottom Action Strip */}
      <section style={{ maxWidth: '1240px', margin: '0 auto 90px', padding: '0 24px' }}>
        <div style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(2, 132, 199, 0.3) 0%, rgba(15, 23, 42, 0.8) 70%)',
          borderRadius: '26px',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '56px 36px',
          textAlign: 'center',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(2, 132, 199, 0.15)',
        }}>
          <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 42px)', fontWeight: 900, color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.03em' }}>
            Bắt đầu bảo vệ khu dân cư của bạn ngay hôm nay
          </h2>
          <p style={{ maxWidth: '620px', margin: '0 auto 32px', color: '#94a3b8', fontSize: '16px', lineHeight: 1.6 }}>
            Chỉ cần 1 bức ảnh chụp từ điện thoại thông minh, bạn đã góp phần ngăn chặn kịp thời những trận ngập úng đô thị cục bộ.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/analyze" className="btn-space-primary">
              <Camera size={19} />
              <span>Chụp ảnh phân tích ngay</span>
            </Link>
            <Link href="/map" className="btn-space-glass">
              <MapIcon size={19} />
              <span>Khám phá bản đồ</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
