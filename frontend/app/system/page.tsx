'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Boxes,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { api } from '@/services/api';
import type { Model } from '@/types';

type SystemInfo = {
  backend: string;
  database: string;
  cuda_available: boolean;
  gpu_name?: string | null;
  device: string;
  model_loaded: boolean;
  active_model_id?: number | null;
  model_task?: string | null;
  model_classes?: string[] | null;
};

type Tone = 'ok' | 'bad' | 'off' | '';

export default function System() {
  const { data, error, isFetching, refetch } = useQuery({
    queryKey: ['system'],
    queryFn: () => api<SystemInfo>('/system'),
    refetchInterval: 15000,
  });
  const { data: models = [] } = useQuery({
    queryKey: ['system-models'],
    queryFn: () => api<Model[]>('/models'),
    refetchInterval: 15000,
  });
  const active = models.find(m => m.is_active);

  const rows: Array<[string, string, Tone, string]> = [
    ['Backend API', data?.backend === 'ok' ? 'ONLINE' : '—', data?.backend === 'ok' ? 'ok' : error ? 'bad' : 'off', '#10b981'],
    ['PostgreSQL GIS', data?.database === 'ok' ? 'ONLINE' : 'UNAVAILABLE', data?.database === 'ok' ? 'ok' : data ? 'bad' : 'off', '#00f2fe'],
    ['Compute Device', data?.device || 'CPU / CUDA', '', '#38bdf8'],
    ['CUDA Acceleration', data?.cuda_available ? 'AVAILABLE' : 'CPU MODE', data?.cuda_available ? 'ok' : 'off', '#f59e0b'],
    ['GPU Accelerator', data?.gpu_name || 'Standard Compute', '', '#a855f7'],
    ['AI Engine Loaded', data?.model_loaded ? 'READY' : 'STANDBY', data?.model_loaded ? 'ok' : data ? 'bad' : 'off', '#10b981'],
    ['Vision Task', data?.model_task || 'segment', '', '#38bdf8'],
    ['Target Classes', data?.model_classes?.join(', ') || 'drain, debris', '', '#f97316'],
  ];

  const ready = data?.backend === 'ok' && data?.database === 'ok' && data?.model_loaded;

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
              <span>HARDWARE &amp; INFRASTRUCTURE TELEMETRY · 15S AUTO-POLL</span>
            </div>
            <h1 className="admin-cyber-title">
              Trạng thái <span className="title-glow-cyan">Hạ tầng &amp; GPU</span>
            </h1>
          </div>

          <div className="admin-header-actions">
            <div className={`system-health-pill ${ready ? 'is-ready' : 'is-warn'}`}>
              {ready ? <CheckCircle2 size={15} /> : <ShieldAlert size={15} />}
              <span>{ready ? 'ALL SYSTEMS NOMINAL' : 'KIỂM TRA KẾT NỐI'}</span>
            </div>
            <button
              type="button"
              className="btn-glow-primary"
              style={{ padding: '10px 18px', fontSize: '13.5px' }}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={15} className={isFetching ? 'spin' : ''} />
              <span>{isFetching ? 'Đang quét xung...' : 'Quét Hạ Tầng'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-cyber-alert error" role="alert">
            <span>{error.message}</span>
          </div>
        )}

        {/* Live Animated Hardware Topology Pipeline */}
        <section className="system-topology-grid">
          <div className="topology-node">
            <div className="topology-icon" style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}>
              <Server size={24} />
            </div>
            <div className="topology-meta">
              <span>FASTAPI CORE</span>
              <b style={{ color: '#10b981' }}>{data?.backend === 'ok' ? 'ONLINE' : 'CHECKING'}</b>
            </div>
            <div className="portal-energy-conduit" aria-hidden="true">
              <div className="conduit-pulse" />
            </div>
          </div>

          <div className="topology-node">
            <div className="topology-icon" style={{ color: '#00f2fe', borderColor: 'rgba(0,242,254,0.4)' }}>
              <Database size={24} />
            </div>
            <div className="topology-meta">
              <span>POSTGRESQL 16</span>
              <b style={{ color: '#00f2fe' }}>{data?.database === 'ok' ? 'CONNECTED' : 'CHECKING'}</b>
            </div>
            <div className="portal-energy-conduit" aria-hidden="true">
              <div className="conduit-pulse" />
            </div>
          </div>

          <div className="topology-node">
            <div className="topology-icon" style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}>
              <Zap size={24} />
            </div>
            <div className="topology-meta">
              <span>COMPUTE ENGINE</span>
              <b style={{ color: '#f59e0b' }}>{data?.cuda_available ? 'CUDA GPU' : data?.device || 'CPU'}</b>
            </div>
            <div className="portal-energy-conduit" aria-hidden="true">
              <div className="conduit-pulse" />
            </div>
          </div>

          <div className="topology-node">
            <div className="topology-icon" style={{ color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)' }}>
              <Cpu size={24} className="spin-slow" />
            </div>
            <div className="topology-meta">
              <span>ULTRALYTICS AI</span>
              <b style={{ color: '#38bdf8' }}>{data?.model_loaded ? 'LOADED' : 'STANDBY'}</b>
            </div>
          </div>
        </section>

        {/* 8 Telemetry Pods */}
        <section className="admin-kpi-grid" style={{ marginTop: '24px' }}>
          {rows.map(([label, value, tone, color]) => (
            <div
              key={label}
              className="admin-kpi-pod"
              style={{ '--pod-color': color } as React.CSSProperties}
            >
              <div className="kpi-pod-top">
                <span className="kpi-pod-label">{label}</span>
                {tone ? (
                  <span className={`dot ${tone}`} />
                ) : (
                  <HardDrive size={15} style={{ color }} />
                )}
              </div>
              <div className="kpi-pod-value" style={{ fontSize: '20px', color }}>
                {value}
              </div>
            </div>
          ))}
        </section>

        {/* Active Neural Engine Visual Showcase */}
        <section className="admin-glass-panel" style={{ marginTop: '26px' }}>
          <div className="admin-panel-head">
            <div>
              <span className="admin-eyebrow">ACTIVE VISION KERNEL</span>
              <h2 className="admin-panel-title">Mô Hình Thị Giác Đang Vận Hành</h2>
            </div>
            <Link href="/admin/models" className="footer-quick-try">
              <Boxes size={14} />
              <span>Đổi AI Model</span>
            </Link>
          </div>

          <div className="system-active-showcase">
            <div className="system-showcase-img">
              <img src="/demo/drain-annotated-2.jpg" alt="Active AI Vision" />
              <div className="ai-zone-scanline" />
              <div className="portal-step-chip">LIVE SEGMENTATION STREAM</div>
            </div>

            <div className="system-showcase-specs">
              {active ? (
                <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">TÊN MODEL</span>
                    <div className="kpi-pod-value" style={{ fontSize: '20px' }}>{active.name}</div>
                  </div>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">PHIÊN BẢN</span>
                    <div className="kpi-pod-value" style={{ fontSize: '20px', color: '#00f2fe' }}>{active.version}</div>
                  </div>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">TÁC VỤ (TASK)</span>
                    <div className="kpi-pod-value" style={{ fontSize: '20px', color: '#10b981' }}>{active.task || 'segment'}</div>
                  </div>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">ĐỘ PHÂN GIẢI (IMGSZ)</span>
                    <div className="kpi-pod-value" style={{ fontSize: '20px', color: '#f59e0b' }}>{active.imgsz ?? 1024}px</div>
                  </div>
                </div>
              ) : (
                <div className="admin-cyber-alert info">
                  <Activity size={18} />
                  <span>Hệ thống chuẩn bị kernel YOLO26l-Seg (yolo26l-seg.pt). Vào mục AI Models để nạp và kích hoạt trọng số (.pt).</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
