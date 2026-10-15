'use client';

import Link from 'next/link';
import { Droplets, ShieldCheck, MapPin, Camera, History, ExternalLink, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand">
              <span className="brand-mark"><Droplets size={20} /></span>
              <span className="brand-text">DrainGuard AI</span>
            </div>
            <p className="footer-desc">
              Hệ thống trí tuệ nhân tạo giám sát miệng thu nước và hỗ trợ cảnh báo nguy cơ ngập úng đô thị theo thời gian thực.
            </p>
            <div className="footer-status-pill">
              <span className="dot ok" />
              <span>Hệ thống AI đang hoạt động trực tuyến</span>
            </div>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-heading">Chức năng chính</h4>
            <ul className="footer-links">
              <li><Link href="/"><span className="link-bullet">•</span>Trang chủ cộng đồng</Link></li>
              <li><Link href="/analyze"><span className="link-bullet">•</span>Kiểm tra & Phân tích ảnh</Link></li>
              <li><Link href="/map"><span className="link-bullet">•</span>Bản đồ giám sát ngập</Link></li>
              <li><Link href="/history"><span className="link-bullet">•</span>Lịch sử kiểm tra</Link></li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-heading">Mức độ cảnh báo</h4>
            <ul className="footer-guide">
              <li><span className="status LOW sm">Thông thoáng</span>: Thoát nước tốt (0-20%)</li>
              <li><span className="status MODERATE sm">Có nguy cơ</span>: Bắt đầu có rác (21-50%)</li>
              <li><span className="status HIGH sm">Tắc nhiều</span>: Rác bít tắc nặng (51-75%)</li>
              <li><span className="status CRITICAL sm">Nguy hiểm</span>: Bít kín miệng cống (&gt;75%)</li>
            </ul>
          </div>

          <div className="footer-nav-col">
            <h4 className="footer-heading">Dành cho Quản trị</h4>
            <p className="footer-subtext">
              Dành cho cán bộ quản lý hạ tầng đô thị và kỹ thuật viên AI:
            </p>
            <Link href="/admin" className="button outline-light sm footer-admin-btn">
              <ShieldCheck size={16} />
              Cổng Quản trị viên
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} DrainGuard AI. Ứng dụng công nghệ vì cộng đồng và đô thị thông minh.</p>
          <div className="footer-bottom-links">
            <span>Phiên bản 2.1 Web</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
