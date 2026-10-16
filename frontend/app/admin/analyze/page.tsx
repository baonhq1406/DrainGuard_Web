'use client';

import Link from 'next/link';
import { CheckCircle2, MapPin } from 'lucide-react';
import { AdminInspectStudio } from '@/components/admin-inspect-studio';

export default function AdminAnalyzePage() {
  return (
    <div className="visual-space-home" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      <main id="main" className="admin-cyber-wrap">
        <div className="admin-command-header">
          <div>
            <div className="hero-pill-indicator" style={{ marginBottom: '10px' }}>
              <span className="radar-ping-dot" />
              <span>ADMIN INSPECTION &amp; GIS TAGGING · YOLO26l-Seg</span>
            </div>
            <h1 className="admin-cyber-title">
              Kiểm tra Miệng thu &amp; <span className="title-glow-cyan">Định vị Tọa độ Cống.</span>
            </h1>
          </div>

          <div className="admin-header-actions">
            <Link href="/map" className="admin-quick-chip">
              <MapPin size={15} className="text-sky-400" />
              <span>Xem Bản đồ Giám sát</span>
            </Link>
            <Link href="/history" className="admin-quick-chip">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>Lịch sử Phản ánh</span>
            </Link>
          </div>
        </div>

        <AdminInspectStudio />
      </main>
    </div>
  );
}
