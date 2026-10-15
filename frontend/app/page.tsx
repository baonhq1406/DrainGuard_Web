'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  Cpu,
  Layers,
  Map as MapIcon,
  Play,
  Pause,
  Scan,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'annotated' | 'raw'>('annotated');
  const [scannerActive, setScannerActive] = useState(true);
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  const demoPairs = [
    {
      raw: '/demo/drain-sample-2.jpg',
      annotated: '/demo/drain-annotated-2.jpg',
      title: 'Đường Hùng Vương - Bọc rác sinh hoạt lớn',
      status: 'TẮC NGHIÊM TRỌNG',
      blockage: '78%',
      debrisCount: 5,
      inferenceTime: '36ms',
    },
    {
      raw: '/demo/drain-raw.jpg',
      annotated: '/demo/drain-annotated.jpg',
      title: 'Đường Lê Duẩn - Lá cây & rác che lấp lưới',
      status: 'CÓ NGUY CƠ',
      blockage: '41%',
      debrisCount: 7,
      inferenceTime: '38ms',
    },
  ];

  const currentDemo = demoPairs[selectedDemoIndex];

  return (
    <main className="modern-home-wrapper">
      {/* 1. Hero Section */}
      <section className="modern-hero">
        <div className="hero-glow-bg" />

        {/* Live Pill Badge */}
        <div className="modern-pill-badge">
          <span className="pill-pulse-dot" />
          <span>DRAINGUARD AI 2026 · HẠ TẦNG ĐÔ THỊ THÔNG MINH</span>
        </div>

        {/* Punchy Minimal Headline */}
        <h1 className="modern-hero-title">
          Phát hiện tắc nghẽn miệng cống <br />
          <span className="hero-gradient-text">chỉ trong 38ms bằng AI Vision</span>
        </h1>

        <p className="modern-hero-subtitle">
          Tự động định vị, phân loại rác thải và đo lường diện tích bít tắc theo thời gian thực
          để cảnh báo sớm nguy cơ ngập úng đô thị.
        </p>

        {/* Hero Action Buttons */}
        <div className="modern-hero-cta">
          <Link href="/analyze" className="cta-btn-primary">
            <Camera size={19} />
            <span>Chụp ảnh kiểm tra ngay</span>
          </Link>
          <Link href="/map" className="cta-btn-secondary">
            <MapIcon size={19} />
            <span>Mở bản đồ giám sát 3D</span>
          </Link>
        </div>

        {/* 2. Interactive Hero Visual Terminal (The Showcase) */}
        <div className="hero-visual-terminal">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="terminal-dot dot-red" />
              <span className="terminal-dot dot-yellow" />
              <span className="terminal-dot dot-green" />
            </div>

            <div className="terminal-title-pill">
              <Cpu size={14} className="text-sky-500" />
              <span>YOLOv11x-Seg · Live Inference Simulator</span>
            </div>

            {/* Toggle Modes */}
            <div className="terminal-toggle-group">
              <button
                type="button"
                className={`terminal-tab-btn ${activeTab === 'annotated' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('annotated')}
              >
                ✨ AI Bounding Box
              </button>
              <button
                type="button"
                className={`terminal-tab-btn ${activeTab === 'raw' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                📷 Ảnh thực địa
              </button>
              <button
                type="button"
                className="terminal-tab-btn"
                onClick={() => setScannerActive(prev => !prev)}
                title={scannerActive ? 'Tạm dừng laser' : 'Chạy laser quét'}
              >
                {scannerActive ? <Pause size={13} /> : <Play size={13} />}
              </button>
            </div>
          </div>

          <div className="terminal-viewport">
            {/* Main Image */}
            <img
              src={activeTab === 'annotated' ? currentDemo.annotated : currentDemo.raw}
              alt={currentDemo.title}
              className="terminal-image"
            />

            {/* Laser Scanner Beam */}
            {scannerActive && (
              <div className="scanner-laser-beam">
                <div className="scanner-laser-glow" />
              </div>
            )}

            {/* Floating Glass HUD Top-Left */}
            <div className="floating-hud hud-top-left">
              <div className="hud-badge-status">
                <span className="hud-status-indicator" />
                <span>{currentDemo.status}</span>
              </div>
              <div className="hud-detail-row">
                <span>Bít tắc: <b>{currentDemo.blockage}</b></span>
                <span>Vật cản: <b>{currentDemo.debrisCount} điểm rác</b></span>
              </div>
            </div>

            {/* Floating Glass HUD Bottom-Right */}
            <div className="floating-hud hud-bottom-right">
              <div className="hud-detail-row" style={{ margin: 0 }}>
                <span>Độ trễ AI: <b style={{ color: '#38bdf8' }}>{currentDemo.inferenceTime}</b></span>
                <span>Tọa độ: <b>16.0678° N, 108.2208° E</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Modern Bento Grid Showcase */}
      <section className="modern-bento-section">
        <div className="bento-section-header">
          <div className="bento-eyebrow">CÔNG NGHỆ THẾ HỆ MỚI</div>
          <h2 className="bento-heading">Hệ thống thông minh cho đô thị tương lai</h2>
        </div>

        <div className="bento-grid">
          {/* Card 1: GIS 3D Realtime Map (Span 8) */}
          <Link href="/map" className="bento-card bento-col-8">
            <span className="bento-card-badge">
              <Layers size={13} /> BẢN ĐỒ VECTOR 4K
            </span>
            <h3 className="bento-card-title">Bản đồ Giám sát Ngập lụt Thời gian thực</h3>
            <p className="bento-card-desc">
              Tích hợp trực tiếp dữ liệu GIS đô thị, hiển thị các điểm nóng bít tắc và bán kính nguy cơ ngập úng với công nghệ Vector 60fps mượt mà.
            </p>

            <div className="sample-gallery-strip" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="sample-thumb-item" style={{ aspectRatio: '16/9' }}>
                <img src="/demo/drain-annotated-2.jpg" alt="Thực địa 1" />
                <span className="sample-thumb-label">Điểm nóng #104 · Bít tắc 78%</span>
              </div>
              <div className="sample-thumb-item" style={{ aspectRatio: '16/9' }}>
                <img src="/demo/drain-annotated.jpg" alt="Thực địa 2" />
                <span className="sample-thumb-label">Điểm nóng #102 · Bít tắc 41%</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '18px', color: '#0284c7', fontWeight: 800, fontSize: '13px' }}>
              <span>Xem trực tiếp bản đồ</span>
              <ArrowRight size={15} />
            </div>
          </Link>

          {/* Card 2: AI Speed & Precision (Span 4) */}
          <div className="bento-card bento-col-4">
            <span className="bento-card-badge">
              <Zap size={13} /> TỐC ĐỘ XỬ LÝ
            </span>
            <h3 className="bento-card-title">Tức thời & Chính xác</h3>
            <p className="bento-card-desc">
              Mô hình YOLOv11x-Seg tối ưu hóa trực tiếp trên GPU, phân tách từng túi nilon, cành cây và bùn đất.
            </p>
            <div className="metric-mega-number">38ms</div>
            <span style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', fontWeight: 600 }}>
              Thời gian suy luận trung bình mỗi ảnh
            </span>
          </div>

          {/* Card 3: Visual Risk Gauge (Span 4) */}
          <div className="bento-card bento-col-4">
            <span className="bento-card-badge">
              <Activity size={13} /> PHÂN CẤP TẮC NGHẼN
            </span>
            <h3 className="bento-card-title">Thang đo Diện tích Chuẩn xác</h3>
            <p className="bento-card-desc">
              Tự động tính tỷ lệ phần trăm diện tích miệng cống bị che lấp để đề xuất mức độ ưu tiên xử lý.
            </p>

            <div className="visual-gauge-wrap">
              <div className="gauge-bar-track">
                <div className="gauge-bar-fill" />
              </div>
              <div className="gauge-legend-row">
                <span style={{ color: '#16a34a' }}>0% Sạch</span>
                <span style={{ color: '#ca8a04' }}>25% Nguy cơ</span>
                <span style={{ color: '#ea580c' }}>50% Tắc</span>
                <span style={{ color: '#dc2626' }}>&gt;75% Nguy hiểm</span>
              </div>
            </div>
          </div>

          {/* Card 4: Interactive Sample Picker (Span 8) */}
          <div className="bento-card bento-col-8">
            <span className="bento-card-badge">
              <Scan size={13} /> THỬ NGHIỆM TRỰC QUAN
            </span>
            <h3 className="bento-card-title">Chọn ảnh mẫu để kiểm tra ngay lập tức</h3>
            <p className="bento-card-desc">
              Nhấp vào một trong các tình huống thực địa dưới đây để thay đổi trực tiếp màn hình mô phỏng phía trên.
            </p>

            <div className="sample-gallery-strip">
              {demoPairs.map((pair, idx) => (
                <div
                  key={pair.title}
                  className="sample-thumb-item"
                  style={{
                    borderColor: selectedDemoIndex === idx ? '#0284c7' : 'transparent',
                    boxShadow: selectedDemoIndex === idx ? '0 0 0 3px rgba(2, 132, 199, 0.25)' : 'none',
                  }}
                  onClick={() => setSelectedDemoIndex(idx)}
                >
                  <img src={pair.annotated} alt={pair.title} />
                  <span className="sample-thumb-label">{pair.status} ({pair.blockage})</span>
                </div>
              ))}
              <Link
                href="/analyze"
                className="sample-thumb-item"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  background: '#f0f7fc',
                  color: '#0284c7',
                  border: '2px dashed #b9d8ee',
                  textDecoration: 'none',
                  padding: '12px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <Camera size={24} style={{ margin: '0 auto 6px' }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, display: 'block' }}>Tải ảnh của bạn</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Modern Banner */}
      <section style={{ maxWidth: '1240px', margin: '40px auto 80px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #097bc7 0%, #0369a1 100%)',
          borderRadius: '24px',
          padding: '48px 32px',
          color: '#fff',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(3, 105, 161, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <h2 style={{ fontSize: 'clamp(24px, 3.2vw, 36px)', fontWeight: 850, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
            Bắt đầu kiểm tra hệ thống thoát nước khu vực của bạn
          </h2>
          <p style={{ maxWidth: '580px', margin: '0 auto 28px', color: '#e0f2fe', fontSize: '15px', lineHeight: 1.6 }}>
            Chụp ảnh nhanh bằng điện thoại và nhận kết quả phân tích mức độ bít tắc kèm tọa độ GPS tức thì.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/analyze"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#0284c7',
                fontWeight: 800,
                fontSize: '14px',
                padding: '12px 22px',
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              <Camera size={18} />
              <span>Chụp ảnh phân tích ngay</span>
            </Link>
            <Link
              href="/map"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '14px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.3)',
                textDecoration: 'none',
              }}
            >
              <MapIcon size={18} />
              <span>Xem bản đồ đô thị</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
