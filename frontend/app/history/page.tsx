'use client';

import { useState, useRef, type MouseEvent, type TouchEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Camera,
  Cpu,
  Eye,
  Filter,
  Grid,
  Layers,
  List,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { api, files } from '@/services/api';
import type { Model, RecordItem, Status } from '@/types';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Thông thoáng', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
  MODERATE: { label: 'Có nguy cơ', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  HIGH: { label: 'Cảnh báo', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  CRITICAL: { label: 'Báo động đỏ', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  MODEL_LIMITED: { label: 'Chưa đủ dữ liệu', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  NO_DRAIN: { label: 'Không phát hiện cống', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
};

export default function History() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | Status>('ALL');
  const [modelId, setModelId] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selected, setSelected] = useState<RecordItem | null>(null);

  // Slider State for Drawer
  const [sliderPos, setSliderPos] = useState(50);
  const [drawerPhotoView, setDrawerPhotoView] = useState<'split' | 'annotated' | 'original'>('split');
  const sliderRef = useRef<HTMLDivElement>(null);

  function handleSliderMove(clientX: number) {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }

  const { data: models = [] } = useQuery({
    queryKey: ['models'],
    queryFn: () => api<Model[]>('/models'),
  });

  const query = new URLSearchParams();
  if (search.trim()) query.set('q', search.trim());
  if (status !== 'ALL') query.set('status', status);
  if (modelId !== 'ALL') query.set('model_id', modelId);
  query.set('limit', '100');

  const { data = [], error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['records', search, status, modelId],
    queryFn: () => api<RecordItem[]>('/records?' + query.toString()),
  });

  async function remove(id: number) {
    if (!window.confirm(`Xác nhận xóa bản ghi kiểm tra #${id}?`)) return;
    try {
      await api('/records/' + id, { method: 'DELETE' });
      if (selected?.id === id) setSelected(null);
      qc.invalidateQueries({ queryKey: ['records'] });
      qc.invalidateQueries({ queryKey: ['recent'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['map-records'] });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Không thể xóa bản ghi');
    }
  }

  function openDetail(item: RecordItem) {
    setSelected(item);
    setDrawerPhotoView(item.annotated_image_url && item.original_image_url ? 'split' : 'annotated');
    setSliderPos(50);
  }

  // Selected Drain Circular Gauge Calculations
  const bVal =
    selected?.blockage_percent != null ? Math.min(100, Math.max(0, selected.blockage_percent)) : 0;
  const rRadius = 26;
  const rCircum = 2 * Math.PI * rRadius;
  const rOffset = rCircum - (rCircum * bVal) / 100;
  const gColor = bVal > 70 ? '#ef4444' : bVal > 40 ? '#f97316' : bVal > 20 ? '#f59e0b' : '#10b981';

  return (
    <div className="visual-space-home" style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      {/* 1. Ambient Lighting & Space Backdrop */}
      <div className="space-aurora-glow" />
      <div className="gis-grid-backdrop" />

      <main id="main" className="history-page-wrap">
        {/* Header */}
        <div className="history-header">
          <div className="hero-pill-indicator" style={{ marginBottom: '14px' }}>
            <span className="radar-ping-dot" />
            <span>NHẬT KÝ THỰC ĐỊA &amp; PHẢN ÁNH THỦY VĂN ĐÔ THỊ</span>
          </div>

          <h1 className="history-title">
            Lịch sử Phản ánh &amp; Giám sát. <br />
            <span className="title-glow-cyan">Dữ liệu thị giác kiểm định 2026.</span>
          </h1>
        </div>

        {/* 2. Cybernetic Filter Command Bar */}
        <div className="history-filter-bar">
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }}
            />
            <input
              type="text"
              placeholder="Tìm theo mã, trạng thái, đường phố..."
              className="history-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '10px',
                  background: 'transparent',
                  border: 0,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Status Pills Row */}
          <div className="gis-filter-pills" style={{ margin: '0' }}>
            <button
              type="button"
              className={`gis-pill ${status === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatus('ALL')}
            >
              Tất cả
            </button>
            <button
              type="button"
              className={`gis-pill tone-critical ${status === 'CRITICAL' ? 'active' : ''}`}
              onClick={() => setStatus('CRITICAL')}
            >
              Báo động đỏ
            </button>
            <button
              type="button"
              className={`gis-pill tone-high ${status === 'HIGH' ? 'active' : ''}`}
              onClick={() => setStatus('HIGH')}
            >
              Cảnh báo
            </button>
            <button
              type="button"
              className={`gis-pill tone-moderate ${status === 'MODERATE' ? 'active' : ''}`}
              onClick={() => setStatus('MODERATE')}
            >
              Có nguy cơ
            </button>
            <button
              type="button"
              className={`gis-pill tone-low ${status === 'LOW' ? 'active' : ''}`}
              onClick={() => setStatus('LOW')}
            >
              Thông thoáng
            </button>
          </div>

          {/* Model Filter Dropdown */}
          <select
            value={modelId}
            onChange={e => setModelId(e.target.value)}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '12.5px',
              fontWeight: 600,
            }}
          >
            <option value="ALL">Tất cả AI Model</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} · {m.version}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            type="button"
            className="gis-action-icon-btn"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới"
          >
            <RefreshCw size={15} className={isFetching ? 'spin' : ''} />
          </button>

          {/* Grid / Table View Switcher */}
          <div className="history-view-toggle">
            <button
              type="button"
              className={`history-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Dạng thẻ thị giác"
            >
              <Grid size={15} />
              <span>Thẻ ảnh</span>
            </button>
            <button
              type="button"
              className={`history-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Dạng bảng dữ liệu"
            >
              <List size={15} />
              <span>Bảng số liệu</span>
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
            <Loader2 size={36} className="spin" style={{ color: '#00f2fe', margin: '0 auto 12px' }} />
            <div>Đang tải hồ sơ thực địa…</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !data.length && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Filter size={36} style={{ color: '#38bdf8', margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: '0 0 6px' }}>
              Không tìm thấy bản ghi phù hợp
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: '0 auto 20px' }}>
              Thử tìm kiếm với từ khóa khác hoặc bấm nút đặt lại bộ lọc.
            </p>
            <button
              type="button"
              className="btn-glass-secondary"
              onClick={() => {
                setSearch('');
                setStatus('ALL');
                setModelId('ALL');
              }}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}

        {/* VIEW 1: Visual Photo Cards Grid */}
        {!isLoading && Boolean(data.length) && viewMode === 'grid' && (
          <div className="history-cards-grid">
            {data.map(item => {
              const cfg = statusConfig[item.status] || {
                label: item.status,
                color: '#38bdf8',
                bg: 'rgba(56, 189, 248, 0.15)',
              };
              const imgUrl = item.annotated_image_url || item.original_image_url;

              return (
                <div
                  key={item.id}
                  className="history-card-item"
                  onClick={() => openDetail(item)}
                >
                  <div className="history-card-thumb-wrap">
                    {imgUrl ? (
                      <img src={files(imgUrl)} alt={`Miệng thu #${item.id}`} loading="lazy" />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#64748b',
                        }}
                      >
                        <Camera size={32} />
                      </div>
                    )}

                    {/* Hover Laser Scanline */}
                    <div className="marquee-hover-scan" />

                    {/* Floating Status Pill */}
                    <div
                      className="history-card-badge-top"
                      style={{
                        background: 'rgba(10, 16, 30, 0.85)',
                        border: `1px solid ${cfg.color}50`,
                        color: cfg.color,
                      }}
                    >
                      ● {item.blockage_percent != null ? `Tắc ${item.blockage_percent}%` : cfg.label}
                    </div>
                  </div>

                  <div className="history-card-body">
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                          Miệng thu #{item.id}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            color: cfg.color,
                            background: cfg.bg,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#94a3b8',
                          fontSize: '11.5px',
                          marginTop: '6px',
                        }}
                      >
                        <Calendar size={13} />
                        <span>{new Date(item.created_at).toLocaleString('vi-VN')}</span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#38bdf8',
                          fontSize: '11.5px',
                          marginTop: '4px',
                        }}
                      >
                        <MapPin size={13} />
                        <span>
                          {item.latitude && item.longitude
                            ? `${item.latitude.toFixed(4)}°, ${item.longitude.toFixed(4)}°`
                            : 'Chưa có GPS'}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                        {item.model?.name || 'YOLO26l-Seg'}
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="gis-action-icon-btn"
                          style={{ width: '28px', height: '28px', color: '#ef4444' }}
                          title="Xóa bản ghi"
                          onClick={e => {
                            e.stopPropagation();
                            remove(item.id);
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: Data Table View */}
        {!isLoading && Boolean(data.length) && viewMode === 'table' && (
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Ảnh thực địa</th>
                  <th>Mã ID</th>
                  <th>Thời gian</th>
                  <th>Mô hình</th>
                  <th>Vật cản</th>
                  <th>Độ tin cậy</th>
                  <th>Tỉ lệ bít tắc</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => {
                  const cfg = statusConfig[item.status] || {
                    label: item.status,
                    color: '#38bdf8',
                    bg: 'rgba(56, 189, 248, 0.15)',
                  };
                  const isSelected = selected?.id === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`table-row-clickable ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => openDetail(item)}
                    >
                      <td>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#020617',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          {item.annotated_image_url || item.original_image_url ? (
                            <img
                              src={files((item.annotated_image_url || item.original_image_url)!)}
                              alt="thumb"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#64748b' }}>
                              <Camera size={18} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <b style={{ color: '#ffffff' }}>#{item.id}</b>
                      </td>
                      <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ color: '#cbd5e1' }}>
                        {item.model?.name || 'YOLO26l-Seg'} · {item.model?.version || 'v1'}
                      </td>
                      <td>
                        <b>{item.drain_count} điểm</b>
                      </td>
                      <td style={{ color: '#38bdf8' }}>
                        {item.confidence != null ? `${(item.confidence * 100).toFixed(0)}%` : '—'}
                      </td>
                      <td>
                        <b style={{ color: cfg.color }}>
                          {item.blockage_percent != null ? `${item.blockage_percent}%` : '—'}
                        </b>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 800,
                            color: cfg.color,
                            background: cfg.bg,
                            border: `1px solid ${cfg.color}40`,
                          }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="gis-action-icon-btn"
                          style={{ width: '30px', height: '30px', color: '#ef4444', display: 'inline-grid' }}
                          title="Xóa bản ghi"
                          onClick={e => {
                            e.stopPropagation();
                            remove(item.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Detail Slide-Out Inspector Drawer / Modal */}
        {selected && (
          <div
            style={{
              position: 'fixed',
              top: '72px',
              bottom: '20px',
              right: '20px',
              width: 'min(460px, 94vw)',
              zIndex: 100,
              animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="inspector-card" style={{ position: 'relative' }}>
              {/* Corner HUD Brackets */}
              <div className="hud-corner tl" style={{ borderColor: 'rgba(56, 189, 248, 0.5)' }} />
              <div className="hud-corner tr" style={{ borderColor: 'rgba(56, 189, 248, 0.5)' }} />

              {/* Head */}
              <div className="inspector-head">
                <div>
                  <div className="eyebrow">HỒ SƠ THỰC ĐỊA CHI TIẾT</div>
                  <h3 className="inspector-title">Miệng thu nước #{selected.id}</h3>
                  <div className="inspector-time">
                    {new Date(selected.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>

                <button
                  type="button"
                  className="inspector-close-btn"
                  onClick={() => setSelected(null)}
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Interactive Split-Screen Photo Slider */}
              <div className="inspector-photo-section">
                {drawerPhotoView === 'split' && selected.original_image_url && selected.annotated_image_url ? (
                  <div
                    ref={sliderRef}
                    className="inspector-photo-box"
                    style={{ cursor: 'ew-resize', position: 'relative', overflow: 'hidden', userSelect: 'none' }}
                    onMouseMove={e => handleSliderMove(e.clientX)}
                    onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
                    onClick={e => handleSliderMove(e.clientX)}
                  >
                    <img
                      src={files(selected.original_image_url)}
                      alt="Ảnh thực địa gốc"
                      className="stage-img-raw"
                    />
                    <div
                      className="stage-img-overlay-clip"
                      style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
                    >
                      <img
                        src={files(selected.annotated_image_url)}
                        alt="Ảnh AI phân tách"
                        className="stage-img-annotated"
                      />
                    </div>
                    <div className="stage-divider" style={{ left: `${sliderPos}%` }}>
                      <div className="stage-handle" style={{ width: '32px', height: '32px', fontSize: '13px' }}>
                        <span>↔</span>
                      </div>
                    </div>
                    <div className="stage-tag stage-tag-left" style={{ fontSize: '9px', padding: '3px 8px' }}>📷 Gốc</div>
                    <div className="stage-tag stage-tag-right" style={{ fontSize: '9px', padding: '3px 8px' }}>✨ AI Phân tách</div>
                  </div>
                ) : drawerPhotoView === 'original' && selected.original_image_url ? (
                  <div className="inspector-photo-box">
                    <img src={files(selected.original_image_url)} alt="Ảnh gốc" />
                  </div>
                ) : selected.annotated_image_url ? (
                  <div className="inspector-photo-box">
                    <img src={files(selected.annotated_image_url)} alt="Ảnh AI" />
                  </div>
                ) : (
                  <div className="inspector-photo-box">
                    <div className="photo-placeholder">Không có hình ảnh</div>
                  </div>
                )}

                {/* Toggle Bar */}
                <div className="photo-toggle-bar">
                  {selected.original_image_url && selected.annotated_image_url && (
                    <button
                      type="button"
                      className={`photo-toggle-btn ${drawerPhotoView === 'split' ? 'active' : ''}`}
                      onClick={() => setDrawerPhotoView('split')}
                    >
                      <Sparkles size={13} /> So sánh ↔
                    </button>
                  )}
                  {selected.annotated_image_url && (
                    <button
                      type="button"
                      className={`photo-toggle-btn ${drawerPhotoView === 'annotated' ? 'active' : ''}`}
                      onClick={() => setDrawerPhotoView('annotated')}
                    >
                      <Layers size={13} /> Ảnh AI
                    </button>
                  )}
                  {selected.original_image_url && (
                    <button
                      type="button"
                      className={`photo-toggle-btn ${drawerPhotoView === 'original' ? 'active' : ''}`}
                      onClick={() => setDrawerPhotoView('original')}
                    >
                      <Eye size={13} /> Ảnh gốc
                    </button>
                  )}
                </div>
              </div>

              {/* Circular Gauge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  marginBottom: '14px',
                }}
              >
                <div style={{ position: 'relative', width: '56px', height: '56px', flex: 'none' }}>
                  <svg width="56" height="56" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="30" cy="30" r={rRadius} fill="transparent" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="6" />
                    <circle
                      cx="30"
                      cy="30"
                      r={rRadius}
                      fill="transparent"
                      stroke={gColor}
                      strokeWidth="6"
                      strokeDasharray={rCircum}
                      strokeDashoffset={rOffset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease', filter: `drop-shadow(0 0 5px ${gColor}80)` }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                    <b style={{ fontSize: '13px', fontWeight: 900, color: '#ffffff' }}>
                      {selected.blockage_percent != null ? `${selected.blockage_percent}%` : '—'}
                    </b>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Mức độ bít tắc rác bề mặt</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: gColor, marginTop: '2px' }}>
                    {selected.blockage_percent != null && selected.blockage_percent > 70
                      ? 'Báo động cấp 4 · Bít tắc nguy hiểm'
                      : selected.blockage_percent != null && selected.blockage_percent > 40
                      ? 'Cảnh báo cấp 3 · Tắc nhiều rác'
                      : selected.blockage_percent != null && selected.blockage_percent > 20
                      ? 'Cảnh báo cấp 2 · Có nguy cơ'
                      : 'Trạng thái ổn định · Thông thoáng'}
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="inspector-grid">
                <div className="inspector-metric-box">
                  <span className="box-label">Miệng thu</span>
                  <b className="box-val">{selected.drain_count}</b>
                </div>
                <div className="inspector-metric-box">
                  <span className="box-label">Độ tin cậy</span>
                  <b className="box-val" style={{ color: '#38bdf8' }}>
                    {selected.confidence != null ? `${(selected.confidence * 100).toFixed(0)}%` : '—'}
                  </b>
                </div>
                <div className="inspector-metric-box">
                  <span className="box-label">Model AI</span>
                  <b className="box-val" title={selected.model?.name || 'YOLO26l-Seg'}>
                    {selected.model?.version || 'v1'}
                  </b>
                </div>
              </div>

              {/* Location */}
              <div className="inspector-location-card">
                <div className="location-row">
                  <MapPin size={18} className="location-pin-icon" />
                  <div className="location-text">
                    <b>Tọa độ định vị GPS</b>
                    <span>
                      {selected.latitude && selected.longitude
                        ? `${selected.latitude.toFixed(6)}° N, ${selected.longitude.toFixed(6)}° E`
                        : 'Không có dữ liệu GPS cho bản ghi này'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="inspector-actions">
                {selected.latitude && selected.longitude ? (
                  <Link
                    href={`/map?lat=${selected.latitude}&lng=${selected.longitude}`}
                    className="inspector-action-btn primary"
                  >
                    <MapPin size={15} />
                    <span>Xem vị trí trên Bản đồ GIS 3D</span>
                    <ArrowRight size={13} />
                  </Link>
                ) : (
                  <Link href="/map" className="inspector-action-btn primary">
                    <MapPin size={15} />
                    <span>Mở Bản đồ GIS</span>
                  </Link>
                )}

                <button
                  type="button"
                  className="inspector-action-btn outline"
                  style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  onClick={() => remove(selected.id)}
                >
                  <Trash2 size={15} />
                  <span>Xóa bản ghi này</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
