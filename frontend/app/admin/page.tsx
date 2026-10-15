'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  Camera,
  Cpu,
  Database,
  Map as MapIcon,
  Radar,
  RefreshCw,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { api, files } from '@/services/api';
import type { RecordItem } from '@/types';

type Stats = {
  total_analyses: number;
  total_drains: number;
  statuses: Record<string, number>;
  active_model?: { name: string; version: string; classes: string[] } | null;
};

const SEVERITY_META = [
  {
    key: 'LOW',
    label: 'THÔNG THOÁNG',
    range: '0–20%',
    color: '#10b981',
    img: '/demo/drain-sample-5.jpg',
  },
  {
    key: 'MODERATE',
    label: 'CẢNH BÁO SỚM',
    range: '21–50%',
    color: '#f59e0b',
    img: '/demo/drain-raw.jpg',
  },
  {
    key: 'HIGH',
    label: 'TẮC NGHẼN CAO',
    range: '51–75%',
    color: '#f97316',
    img: '/demo/drain-sample-4.jpg',
  },
  {
    key: 'CRITICAL',
    label: 'BÁO ĐỘNG ĐỎ',
    range: '>75%',
    color: '#ef4444',
    img: '/demo/drain-annotated-2.jpg',
  },
];

const DEMO_FEED = [
  {
    id: 901,
    title: 'Hải Châu · Hùng Vương',
    status: 'CRITICAL',
    pct: 78,
    color: '#ef4444',
    img: '/demo/drain-annotated-2.jpg',
    model: 'YOLOv11x-Seg v2.4',
    time: 'Vừa xong',
  },
  {
    id: 902,
    title: 'Hải Châu · Chợ Cồn',
    status: 'HIGH',
    pct: 64,
    color: '#f97316',
    img: '/demo/drain-annotated-4.jpg',
    model: 'YOLOv11x-Seg v2.4',
    time: '5 phút trước',
  },
  {
    id: 903,
    title: 'Thanh Khê · Lê Duẩn',
    status: 'MODERATE',
    pct: 41,
    color: '#f59e0b',
    img: '/demo/drain-annotated.jpg',
    model: 'YOLOv11x-Seg v2.4',
    time: '12 phút trước',
  },
  {
    id: 904,
    title: 'Sơn Trà · Bạch Đằng',
    status: 'LOW',
    pct: 0,
    color: '#10b981',
    img: '/demo/drain-annotated-5.jpg',
    model: 'YOLOv11x-Seg v2.4',
    time: '18 phút trước',
  },
];

export default function AdminDashboard() {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api<Stats>('/dashboard/stats'),
  });
  const { data: recent = [] } = useQuery({
    queryKey: ['admin-recent'],
    queryFn: () => api<RecordItem[]>('/dashboard/recent'),
  });

  const s = data?.statuses || {};
  const alerts = (s.HIGH || 0) + (s.CRITICAL || 0);
  const totalAnalyses = data?.total_analyses ?? 0;
  const totalDrains = data?.total_drains ?? 0;
  const maxStatusCount = Math.max(1, ...SEVERITY_META.map(m => s[m.key] || 0));

  return (
    <div className="visual-space-home" style={{ minHeight: '100vh', paddingBottom: '80px' }}>
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      <main id="main" className="admin-cyber-wrap">
        {/* Top Command Header */}
        <div className="admin-command-header">
          <div>
            <div className="hero-pill-indicator" style={{ marginBottom: '10px' }}>
              <span className="radar-ping-dot" />
              <span>AI &amp; GIS MISSION CONTROL · ĐÀ NẴNG</span>
            </div>
            <h1 className="admin-cyber-title">
              Trung tâm Chỉ huy <span className="title-glow-cyan">Thủy văn AI.</span>
            </h1>
          </div>

          <div className="admin-header-actions">
            <Link href="/admin/models" className="admin-quick-chip">
              <Boxes size={15} className="text-sky-400" />
              <span>AI Models</span>
            </Link>
            <Link href="/admin/datasets" className="admin-quick-chip">
              <Database size={15} className="text-emerald-400" />
              <span>Datasets</span>
            </Link>
            <Link href="/admin/system" className="admin-quick-chip">
              <Server size={15} className="text-amber-400" />
              <span>Hệ thống GPU</span>
            </Link>
            <button
              type="button"
              className="btn-glow-primary"
              style={{ padding: '9px 16px', fontSize: '13px' }}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={15} className={isFetching ? 'spin' : ''} />
              <span>{isFetching ? 'Đang đồng bộ...' : 'Đồng bộ Live'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-cyber-alert error" role="alert">
            <AlertTriangle size={16} />
            <span>{error.message}</span>
          </div>
        )}

        {/* 4 Holographic KPI Telemetry Pods */}
        <section className="admin-kpi-grid">
          <div className="admin-kpi-pod" style={{ '--pod-color': '#00f2fe' } as React.CSSProperties}>
            <div className="kpi-pod-top">
              <span className="kpi-pod-label">TỔNG LƯỢT QUÉT AI</span>
              <div className="kpi-pod-icon" style={{ color: '#00f2fe' }}>
                <Activity size={18} />
              </div>
            </div>
            <div className="kpi-pod-value">{totalAnalyses}</div>
            <div className="kpi-pod-bar">
              <div className="kpi-pod-bar-fill" style={{ width: '78%', background: '#00f2fe' }} />
            </div>
          </div>

          <div className="admin-kpi-pod" style={{ '--pod-color': '#10b981' } as React.CSSProperties}>
            <div className="kpi-pod-top">
              <span className="kpi-pod-label">MIỆNG THU PHÁT HIỆN</span>
              <div className="kpi-pod-icon" style={{ color: '#10b981' }}>
                <Radar size={18} />
              </div>
            </div>
            <div className="kpi-pod-value">{totalDrains}</div>
            <div className="kpi-pod-bar">
              <div className="kpi-pod-bar-fill" style={{ width: '85%', background: '#10b981' }} />
            </div>
          </div>

          <div className="admin-kpi-pod" style={{ '--pod-color': '#ef4444' } as React.CSSProperties}>
            <div className="kpi-pod-top">
              <span className="kpi-pod-label">ĐIỂM NÓNG NGUY HIỂM</span>
              <div className="kpi-pod-icon" style={{ color: '#ef4444' }}>
                <ShieldAlert size={18} />
              </div>
            </div>
            <div className="kpi-pod-value" style={{ color: alerts > 0 ? '#ef4444' : '#ffffff' }}>
              {alerts}
            </div>
            <div className="kpi-pod-bar">
              <div
                className="kpi-pod-bar-fill"
                style={{ width: alerts > 0 ? '68%' : '18%', background: '#ef4444' }}
              />
            </div>
          </div>

          <div className="admin-kpi-pod" style={{ '--pod-color': '#38bdf8' } as React.CSSProperties}>
            <div className="kpi-pod-top">
              <span className="kpi-pod-label">ENGINE ĐANG CHẠY</span>
              <div className="kpi-pod-icon" style={{ color: '#38bdf8' }}>
                <Cpu size={18} className="spin-slow" />
              </div>
            </div>
            <div className="kpi-pod-value" style={{ fontSize: '20px' }}>
              {data?.active_model ? `${data.active_model.name} ${data.active_model.version}` : 'YOLOv11x-Seg'}
            </div>
            <div className="kpi-pod-sub">
              <span className="online-ping-dot" />
              <span>TRỰC TUYẾN · 38ms</span>
            </div>
          </div>
        </section>

        {/* 2-Column Command Matrix: Visual Severity Distribution + Live Satellite Radar */}
        <section className="admin-matrix-grid">
          {/* Left: Visual Severity Distribution with Real Drain Thumbnails */}
          <div className="admin-glass-panel">
            <div className="admin-panel-head">
              <div>
                <span className="admin-eyebrow">TELEMETRY MATRIX</span>
                <h2 className="admin-panel-title">Phân Bố Mức Độ Bít Tắc</h2>
              </div>
              <Link href="/analyze" className="footer-quick-try">
                <Camera size={13} />
                <span>Quét mới</span>
              </Link>
            </div>

            <div className="admin-severity-bars">
              {SEVERITY_META.map(meta => {
                const count = s[meta.key] ?? 0;
                const widthPct = totalAnalyses > 0 ? Math.max(12, Math.round((count / maxStatusCount) * 100)) : 28;
                return (
                  <div key={meta.key} className="admin-sev-row">
                    <div className="admin-sev-thumb">
                      <img src={meta.img} alt={meta.label} />
                      <div className="marquee-hover-scan" />
                    </div>
                    <div className="admin-sev-body">
                      <div className="admin-sev-top">
                        <span className="admin-sev-name" style={{ color: meta.color }}>
                          ● {meta.label} <small>({meta.range})</small>
                        </span>
                        <b className="admin-sev-count">{count} trạm</b>
                      </div>
                      <div className="admin-sev-track">
                        <div
                          className="admin-sev-fill"
                          style={{
                            width: `${widthPct}%`,
                            background: meta.color,
                            boxShadow: `0 0 14px ${meta.color}`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Live Satellite Radar Mini-Viewport */}
          <div className="admin-glass-panel admin-radar-panel">
            <div className="admin-radar-viewport">
              <img src="/demo/satellite-danang-radar.jpg" alt="Radar Đà Nẵng" className="admin-radar-img" />
              <div className="radar-sweep-center">
                <div className="radar-concentric-1" />
                <div className="radar-sweep-cone" />
              </div>

              {/* Pulsing Radar Pings */}
              <div className="admin-radar-pin" style={{ top: '46%', left: '52%', '--pin-c': '#ef4444' } as React.CSSProperties} />
              <div className="admin-radar-pin" style={{ top: '38%', left: '36%', '--pin-c': '#f59e0b' } as React.CSSProperties} />
              <div className="admin-radar-pin" style={{ top: '56%', left: '68%', '--pin-c': '#10b981' } as React.CSSProperties} />

              <div className="admin-radar-hud-top">
                <span className="radar-ping-dot" />
                <span>VỆ TINH GIÁM SÁT THỜI GIAN THỰC</span>
              </div>

              <div className="admin-radar-hud-bottom">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 850, color: '#ffffff' }}>Bản đồ GIS 3D Đà Nẵng</div>
                  <div style={{ fontSize: '11.5px', color: '#38bdf8', fontWeight: 700 }}>16.068° N, 108.220° E</div>
                </div>
                <Link href="/map" className="btn-glow-primary" style={{ padding: '8px 14px', fontSize: '12px' }}>
                  <MapIcon size={14} />
                  <span>Mở GIS</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Visual Recent Inspections Stream */}
        <section className="admin-glass-panel" style={{ marginTop: '24px' }}>
          <div className="admin-panel-head">
            <div>
              <span className="admin-eyebrow">OPTICAL AUDIT STREAM</span>
              <h2 className="admin-panel-title">Hình Ảnh Kiểm Định Gần Đây</h2>
            </div>
            <Link href="/history" className="footer-quick-try">
              <span>Xem toàn bộ nhật ký</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="admin-visual-feed-grid">
            {recent.length > 0
              ? recent.slice(0, 8).map(item => {
                  const meta = SEVERITY_META.find(m => m.key === item.status) || SEVERITY_META[0];
                  const imgUrl = item.annotated_image_url || item.original_image_url;
                  return (
                    <Link key={item.id} href="/history" className="admin-feed-card">
                      <div className="admin-feed-thumb">
                        {imgUrl ? (
                          <img src={files(imgUrl)} alt={`#${item.id}`} loading="lazy" />
                        ) : (
                          <img src={meta.img} alt={`#${item.id}`} loading="lazy" />
                        )}
                        <div className="marquee-hover-scan" />
                        <span
                          className="admin-feed-badge"
                          style={{ background: 'rgba(3, 7, 18, 0.88)', color: meta.color, borderColor: meta.color }}
                        >
                          ● {item.blockage_percent != null ? `${item.blockage_percent}%` : meta.label}
                        </span>
                      </div>
                      <div className="admin-feed-meta">
                        <div className="admin-feed-top">
                          <b>Trạm #{item.id}</b>
                          <span>{item.model?.version || 'v2'}</span>
                        </div>
                        <div className="admin-feed-time">
                          {new Date(item.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </Link>
                  );
                })
              : DEMO_FEED.map(demo => (
                  <Link key={demo.id} href="/analyze" className="admin-feed-card">
                    <div className="admin-feed-thumb">
                      <img src={demo.img} alt={demo.title} loading="lazy" />
                      <div className="marquee-hover-scan" />
                      <span
                        className="admin-feed-badge"
                        style={{ background: 'rgba(3, 7, 18, 0.88)', color: demo.color, borderColor: demo.color }}
                      >
                        ● Tắc {demo.pct}%
                      </span>
                    </div>
                    <div className="admin-feed-meta">
                      <div className="admin-feed-top">
                        <b>{demo.title}</b>
                        <span>{demo.model}</span>
                      </div>
                      <div className="admin-feed-time">{demo.time}</div>
                    </div>
                  </Link>
                ))}
          </div>
        </section>
      </main>
    </div>
  );
}
