'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Droplets,
  History,
  Info,
  MapPin,
  Map as MapIcon,
  ScanSearch,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui';

export default function Home() {
  const steps = [
    {
      title: 'Chụp ảnh tại chỗ',
      desc: 'Mở camera điện thoại hoặc chọn ảnh miệng thu nước trên hè phố.',
      icon: Camera,
    },
    {
      title: 'AI nhận diện thông minh',
      desc: 'Mô hình YOLO tự động phát hiện cấu trúc miệng thu và rác thải.',
      icon: Sparkles,
    },
    {
      title: 'Tính toán độ bít tắc',
      desc: 'Ước tính phần trăm diện tích tắc nghẽn và phân cấp rủi ro.',
      icon: AlertTriangle,
    },
    {
      title: 'Định vị & Lưu trữ',
      desc: 'Ghi nhận tọa độ GPS và lập bản đồ hỗ trợ cơ quan thoát nước.',
      icon: MapPin,
    },
  ];

  const features = [
    {
      href: '/analyze',
      title: 'Kiểm tra miệng thu',
      desc: 'Chụp ảnh hoặc tải lên tệp ảnh để nhận kết quả phân tích AI tức thời.',
      icon: ScanSearch,
      label: 'Bắt đầu kiểm tra',
      tone: 'blue',
    },
    {
      href: '/map',
      title: 'Bản đồ giám sát',
      desc: 'Theo dõi trực quan vị trí các miệng thu nước và điểm nóng ngập lụt.',
      icon: MapIcon,
      label: 'Mở bản đồ',
      tone: 'cyan',
    },
    {
      href: '/history',
      title: 'Lịch sử phản ánh',
      desc: 'Tra cứu danh sách các điểm đã được kiểm tra kèm hình ảnh AI đã phân tích.',
      icon: History,
      label: 'Xem lịch sử',
      tone: 'indigo',
    },
  ];

  return (
    <main id="main" className="main home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>ỨNG DỤNG CỘNG ĐỒNG · CÔNG NGHỆ AI ĐÔ THỊ</span>
          </div>
          <h1 className="hero-heading">
            Bảo vệ miệng thu nước, <br className="hero-br" />
            <span className="hero-highlight">ngăn ngừa ngập úng đô thị</span>
          </h1>
          <p className="hero-description">
            DrainGuard AI giúp người dân và đơn vị quản lý đô thị chụp ảnh kiểm tra tình trạng miệng cống,
            tự động phát hiện rác thải che lấp và ước tính mức độ tắc nghẽn chỉ sau vài giây.
          </p>
          <div className="hero-cta-group">
            <Link href="/analyze" className="button light hero-cta-primary">
              <Camera size={19} />
              <span>Chụp ảnh kiểm tra ngay</span>
            </Link>
            <Link href="/map" className="button outline-light hero-cta-secondary">
              <MapIcon size={19} />
              <span>Xem bản đồ giám sát</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="home-section">
        <div className="section-header">
          <div className="eyebrow">TÍNH NĂNG CHÍNH</div>
          <h2 className="section-title">Công cụ giám sát dành cho mọi người</h2>
          <p className="section-subtitle">
            Giao diện trực quan, dễ sử dụng ngay trên điện thoại di động mà không cần cài đặt phức tạp.
          </p>
        </div>

        <div className="features-grid">
          {features.map(f => {
            const Icon = f.icon;
            return (
              <Link href={f.href} key={f.href} className="feature-card">
                <div className={'feature-icon-wrap ' + f.tone}>
                  <Icon size={24} />
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-action">
                  <span>{f.label}</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Steps Section */}
      <section className="home-section process-section">
        <div className="section-header">
          <div className="eyebrow">QUY TRÌNH HOẠT ĐỘNG</div>
          <h2 className="section-title">4 bước đơn giản để kiểm tra</h2>
          <p className="section-subtitle">
            Hệ thống trí tuệ nhân tạo xử lý tự động từ ảnh chụp đến bản đồ trực quan.
          </p>
        </div>

        <div className="steps-container">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="step-box">
                <div className="step-top">
                  <span className="step-counter">0{idx + 1}</span>
                  <div className="step-icon">
                    <Icon size={20} />
                  </div>
                </div>
                <h4 className="step-name">{s.title}</h4>
                <p className="step-detail">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Warning Levels Guide Section */}
      <section className="home-section">
        <div className="guide-card">
          <div className="guide-head">
            <div>
              <div className="eyebrow">TIÊU CHUẨN ĐÁNH GIÁ</div>
              <h3 className="guide-title">Các mức độ tắc nghẽn miệng thu nước</h3>
              <p className="guide-desc">
                AI phân tích tỷ lệ diện tích bề mặt miệng cống bị rác thải, bùn đất hoặc lá cây che lấp.
              </p>
            </div>
            <Link href="/analyze" className="button outline sm">
              <Camera size={15} /> Thử nghiệm ảnh ngay
            </Link>
          </div>

          <div className="status-grid">
            <div className="status-item tone-low">
              <div className="status-item-head">
                <StatusBadge status="LOW" />
                <span className="status-pct">0% — 20%</span>
              </div>
              <h4>Thông thoáng</h4>
              <p>Miệng thu nước sạch sẽ, nước mưa có thể thoát nhanh chóng vào hệ thống ngầm.</p>
            </div>

            <div className="status-item tone-moderate">
              <div className="status-item-head">
                <StatusBadge status="MODERATE" />
                <span className="status-pct">21% — 50%</span>
              </div>
              <h4>Có nguy cơ tắc</h4>
              <p>Có rác, lá cây hoặc túi nilon bắt đầu che phủ một phần miệng cống.</p>
            </div>

            <div className="status-item tone-high">
              <div className="status-item-head">
                <StatusBadge status="HIGH" />
                <span className="status-pct">51% — 75%</span>
              </div>
              <h4>Tắc nhiều</h4>
              <p>Bề mặt thoát nước bị thu hẹp đáng kể, khả năng tiêu thoát nước giảm mạnh khi mưa lớn.</p>
            </div>

            <div className="status-item tone-critical">
              <div className="status-item-head">
                <StatusBadge status="CRITICAL" />
                <span className="status-pct">&gt; 75%</span>
              </div>
              <h4>Tắc nghiêm trọng</h4>
              <p>Miệng thu gần như bị bít kín hoàn toàn, nguy cơ gây ngập cục bộ rất cao, cần dọn dẹp ngay.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="cta-banner">
        <div className="cta-banner-content">
          <div className="cta-icon-badge">
            <Droplets size={28} />
          </div>
          <h2>Cùng bảo vệ khu dân cư của bạn an toàn trong mùa mưa</h2>
          <p>
            Mỗi bức ảnh phản ánh của bạn là dữ liệu quý giá giúp xây dựng bản đồ hạ tầng đô thị thông minh.
          </p>
          <div className="cta-banner-actions">
            <Link href="/analyze" className="button hero-cta-primary">
              <Camera size={18} /> Gửi ảnh kiểm tra ngay
            </Link>
            <Link href="/map" className="button outline-light">
              <MapIcon size={18} /> Bản đồ cảnh báo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
