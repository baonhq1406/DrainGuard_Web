'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
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
    range: '0–20%',
    pct: 16,
    color: '#10b981',
    img: '/demo/drain-sample-5.jpg',
  },
  {
    code: 'MODERATE',
    label: 'CẢNH BÁO',
    range: '21–50%',
    pct: 41,
    color: '#f59e0b',
    img: '/demo/drain-raw.jpg',
  },
  {
    code: 'HIGH',
    label: 'TẮC CAO',
    range: '51–75%',
    pct: 64,
    color: '#f97316',
    img: '/demo/drain-sample-4.jpg',
  },
  {
    code: 'CRITICAL',
    label: 'BÁO ĐỘNG ĐỎ',
    range: '>75%',
    pct: 88,
    color: '#ef4444',
    img: '/demo/drain-annotated-2.jpg',
  },
];

export function Footer() {
  const pathname = usePathname();

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
        {/* Sleek Single-Bar Visual Severity Ribbon (No bulky boxes) */}
        <div className="footer-ribbon-bar">
          <div className="footer-ribbon-tag">
            <span className="radar-ping-dot" />
            <span>THANG ĐO AI</span>
          </div>

          <div className="footer-ribbon-items">
            {VISUAL_LEVELS.map(lv => (
              <Link
                key={lv.code}
                href="/analyze"
                className="footer-ribbon-item"
                style={{ '--lv-color': lv.color } as React.CSSProperties}
              >
                <div className="ribbon-avatar-ring" style={{ borderColor: lv.color }}>
                  <img src={lv.img} alt={lv.label} loading="lazy" />
                </div>
                <div className="ribbon-item-meta">
                  <div className="ribbon-item-top">
                    <b style={{ color: lv.color }}>{lv.label}</b>
                    <span>{lv.range}</span>
                  </div>
                  <div className="ribbon-mini-bar">
                    <div
                      className="ribbon-mini-fill"
                      style={{ width: `${lv.pct}%`, background: lv.color, boxShadow: `0 0 8px ${lv.color}` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
              <Activity size={14} className="wave-icon-pulse" />
              <span>38ms · YOLO26l-Seg · ĐÀ NẴNG GIS</span>
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
