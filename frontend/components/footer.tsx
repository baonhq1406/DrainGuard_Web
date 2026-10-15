'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  ArrowUpRight,
  Camera,
  Cpu,
  Droplets,
  History,
  Home,
  Map as MapIcon,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';

const VISUAL_LEVELS = [
  {
    code: 'LOW',
    label: 'THÔNG THOÁNG',
    range: '0 – 20%',
    pct: 14,
    color: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    img: '/demo/drain-sample-5.jpg',
    sub: 'Thoát nước tối ưu',
  },
  {
    code: 'MODERATE',
    label: 'CẢNH BÁO SỚM',
    range: '21 – 50%',
    pct: 41,
    color: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.35)',
    img: '/demo/drain-raw.jpg',
    sub: 'Lá cây & bùn đất',
  },
  {
    code: 'HIGH',
    label: 'TẮC NGHẼN CAO',
    range: '51 – 75%',
    pct: 64,
    color: '#f97316',
    glow: 'rgba(249, 115, 22, 0.35)',
    img: '/demo/drain-sample-4.jpg',
    sub: 'Rác nilon che phủ',
  },
  {
    code: 'CRITICAL',
    label: 'BÁO ĐỘNG ĐỎ',
    range: '> 75%',
    pct: 88,
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    img: '/demo/drain-annotated-2.jpg',
    sub: 'Cần nạo vét khẩn',
  },
];

export function Footer() {
  const pathname = usePathname();

  // Trang bản đồ hiển thị full màn hình GIS
  if (pathname === '/map' || pathname?.startsWith('/map/')) {
    return null;
  }

  return (
    <footer className="cyber-footer" role="contentinfo">
      {/* Animated Top Laser Horizon Line */}
      <div className="footer-laser-horizon">
        <div className="footer-laser-beam" />
      </div>

      <div className="cyber-footer-container">
        {/* Visual Severity Matrix (Replaces text-heavy bullet lists) */}
        <div className="footer-visual-header">
          <div className="footer-eyebrow">
            <Cpu size={14} className="text-sky-400" />
            <span>THANG ĐO THỊ GIÁC AI YOLOv11-SEG</span>
          </div>
          <Link href="/analyze" className="footer-quick-try">
            <span>Thử nghiệm ngay</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="footer-severity-grid">
          {VISUAL_LEVELS.map(lv => (
            <Link
              key={lv.code}
              href="/analyze"
              className="footer-severity-card"
              style={{ '--lv-color': lv.color, '--lv-glow': lv.glow } as React.CSSProperties}
            >
              <div className="severity-card-img-wrap">
                <img src={lv.img} alt={lv.label} loading="lazy" />
                <div className="severity-scan-line" />
                <div className="severity-range-pill" style={{ background: lv.color }}>
                  {lv.range}
                </div>
              </div>

              <div className="severity-card-info">
                <div className="severity-card-top">
                  <span className="severity-dot" style={{ background: lv.color, boxShadow: `0 0 10px ${lv.color}` }} />
                  <span className="severity-label" style={{ color: lv.color }}>{lv.label}</span>
                </div>
                <div className="severity-sub">{lv.sub}</div>
                <div className="severity-bar-track">
                  <div
                    className="severity-bar-fill"
                    style={{ width: `${lv.pct}%`, background: lv.color, boxShadow: `0 0 12px ${lv.color}` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom Dock: Brand + Animated Telemetry + Visual Quick Nav Pills */}
        <div className="footer-dock-bar">
          {/* Left: Brand & Live Waveform */}
          <div className="footer-dock-brand">
            <Link href="/" className="brand">
              <span className="brand-mark">
                <Droplets size={20} />
              </span>
              <div className="brand-info">
                <span className="brand-name">DrainGuard AI</span>
                <span className="brand-tag">URBAN HYDROLOGY VISION</span>
              </div>
            </Link>

            <div className="footer-telemetry-wave">
              <Activity size={15} className="wave-icon-pulse" />
              <span>38ms · ĐÀ NẴNG GIS</span>
              <span className="online-ping-dot" />
            </div>
          </div>

          {/* Center: Minimal Icon Navigation Pills */}
          <nav className="footer-dock-nav" aria-label="Liên kết nhanh">
            <Link href="/" className="footer-nav-pill">
              <Home size={14} />
              <span>Trang chủ</span>
            </Link>
            <Link href="/analyze" className="footer-nav-pill">
              <ScanSearch size={14} />
              <span>Kiểm tra AI</span>
            </Link>
            <Link href="/map" className="footer-nav-pill">
              <MapIcon size={14} />
              <span>Bản đồ 3D</span>
            </Link>
            <Link href="/history" className="footer-nav-pill">
              <History size={14} />
              <span>Nhật ký ảnh</span>
            </Link>
            <Link href="/admin" className="footer-nav-pill is-admin-pill">
              <ShieldCheck size={14} />
              <span>Quản trị</span>
            </Link>
          </nav>

          {/* Right: Minimal Copyright & Version Chip */}
          <div className="footer-dock-meta">
            <span className="version-neon-chip">v2.5 CYBER</span>
            <span className="copyright-minimal">© {new Date().getFullYear()} DrainGuard AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
