'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertTriangle,
  Box,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  ListFilter,
  Loader2,
  MapPin,
  Maximize2,
  Navigation as NavigationIcon,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { api, files } from '@/services/api';
import type { RecordItem, Status, EnvironmentItem } from '@/types';
import { AnalysisMap, statusColor, statusLabel, type MapStyleKey } from '@/components/analysis-map';
import { StatusBadge } from '@/components/ui';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapPage() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | Status>('ALL');
  const [search, setSearch] = useState('');
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('modern-light');
  const [layersOpen, setLayersOpen] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const [bearing, setBearing] = useState(0);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDrain, setSelectedDrain] = useState<{
    record: RecordItem;
    group: RecordItem[];
    env?: EnvironmentItem;
  } | null>(null);
  const [photoView, setPhotoView] = useState<'annotated' | 'original'>('annotated');
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [fitBoundsSignal, setFitBoundsSignal] = useState(1);
  const [addressCache, setAddressCache] = useState<Record<string, string>>({});
  const [fetchingAddress, setFetchingAddress] = useState(false);

  const mapInstanceRef = useRef<any>(null);

  // Fetch all records
  const { data = [], error, isFetching, isLoading, refetch } = useQuery({
    queryKey: ['map-records'],
    queryFn: () => api<RecordItem[]>('/records?limit=100'),
  });

  // Filter valid GPS records
  const mapped = useMemo(
    () => data.filter(x => x.latitude != null && x.longitude != null),
    [data]
  );

  // Filtered for display
  const displayRecords = useMemo(() => {
    return mapped.filter(x => {
      const matchStatus = statusFilter === 'ALL' || x.status === statusFilter;
      const matchSearch =
        !search.trim() ||
        String(x.id).includes(search.trim()) ||
        x.status.toLowerCase().includes(search.toLowerCase()) ||
        (x.model?.name && x.model.name.toLowerCase().includes(search.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [mapped, statusFilter, search]);

  // Environment query for weather & elevation
  const environmentQuery = useQuery({
    queryKey: ['map-environment', mapped.map(x => x.latitude!.toFixed(5) + ',' + x.longitude!.toFixed(5)).join('|')],
    enabled: mapped.length > 0,
    queryFn: () => {
      const grouped = new Map<string, RecordItem>();
      [...mapped]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .forEach(x => {
          const key = x.latitude!.toFixed(5) + ',' + x.longitude!.toFixed(5);
          const current = grouped.get(key);
          if (!current || current.blockage_percent == null || x.blockage_percent != null) grouped.set(key, x);
        });
      const values = [...grouped.values()];
      const params = new URLSearchParams({
        latitudes: values.map(x => String(x.latitude!)).join(','),
        longitudes: values.map(x => String(x.longitude!)).join(','),
        blockages: values.map(x => (x.blockage_percent == null ? 'null' : String(x.blockage_percent))).join(','),
      });
      return api<{ items: EnvironmentItem[] }>('/map/environment?' + params.toString());
    },
  });

  const environmentItems = environmentQuery.data?.items || [];
  const envMap = useMemo(
    () => new Map(environmentItems.map(x => [x.latitude.toFixed(5) + ',' + x.longitude.toFixed(5), x])),
    [environmentItems]
  );

  // Summary counts
  const counts = useMemo(
    () => ({
      all: mapped.length,
      low: mapped.filter(x => x.status === 'LOW').length,
      moderate: mapped.filter(x => x.status === 'MODERATE').length,
      high: mapped.filter(x => x.status === 'HIGH').length,
      critical: mapped.filter(x => x.status === 'CRITICAL').length,
    }),
    [mapped]
  );

  // Environment averages
  const envStats = useMemo(() => {
    const precips = environmentItems.map(x => x.precipitation_mm_h).filter((x): x is number => x != null);
    const elevs = environmentItems.map(x => x.elevation_m).filter((x): x is number => x != null);
    const risks = environmentItems.map(x => x.flood_risk_score).filter((x): x is number => x != null);

    return {
      rainAvg: precips.length ? (precips.reduce((a, b) => a + b, 0) / precips.length).toFixed(1) : null,
      elevationAvg: elevs.length ? Math.round(elevs.reduce((a, b) => a + b, 0) / elevs.length) : null,
      maxRisk: risks.length ? Math.max(...risks).toFixed(1) : null,
    };
  }, [environmentItems]);

  // Reverse Geocoding when a drain is selected
  useEffect(() => {
    if (!selectedDrain?.record) return;
    const { latitude, longitude } = selectedDrain.record;
    if (latitude == null || longitude == null) return;
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (addressCache[key]) return;

    setFetchingAddress(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        const addr = data.display_name || 'Vị trí đã định vị GPS';
        setAddressCache(prev => ({ ...prev, [key]: addr }));
      })
      .catch(() => {
        setAddressCache(prev => ({ ...prev, [key]: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
      })
      .finally(() => setFetchingAddress(false));
  }, [selectedDrain?.record?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // User GPS Locate Me
  function locateUser() {
    if (!navigator.geolocation) {
      window.alert('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setFlyToTarget({ lat, lng, zoom: 17.5 });
        setLocatingUser(false);
      },
      err => {
        setLocatingUser(false);
        window.alert('Không thể xác định vị trí hiện tại: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function handleResetNorth() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.resetNorthPitch({ duration: 600 });
      setBearing(0);
      setIs3D(false);
    }
  }

  function handleSelectFromMap(record: RecordItem, group: RecordItem[], env?: EnvironmentItem) {
    setSelectedDrain({ record, group, env });
    setPhotoView('annotated');
  }

  function handleSelectFromList(record: RecordItem) {
    const key = record.latitude!.toFixed(5) + ',' + record.longitude!.toFixed(5);
    const group = mapped.filter(x => x.latitude!.toFixed(5) + ',' + x.longitude!.toFixed(5) === key);
    const env = envMap.get(key);
    setSelectedDrain({ record, group, env });
    setPhotoView('annotated');
    setFlyToTarget({ lat: record.latitude!, lng: record.longitude!, zoom: 17.5 });
  }

  const selectedKey = selectedDrain?.record
    ? selectedDrain.record.latitude!.toFixed(5) + ',' + selectedDrain.record.longitude!.toFixed(5)
    : null;

  return (
    <div className="gis-viewport">
      {/* 1. Map Canvas Background */}
      <div className="gis-map-canvas-container">
        <AnalysisMap
          records={displayRecords}
          environment={environmentItems}
          selectedLocationKey={selectedKey}
          onSelectRecord={handleSelectFromMap}
          mapStyle={mapStyle}
          showRiskZones={showRiskZones}
          is3D={is3D}
          flyToLocation={flyToTarget}
          userLocation={userLocation}
          fitBoundsSignal={fitBoundsSignal}
          onBearingChange={setBearing}
          onMapReady={m => {
            mapInstanceRef.current = m;
          }}
        />
      </div>

      {/* 2. Top Floating Telemetry & Quick Header */}
      <header className="gis-top-bar" aria-label="Thanh thông tin môi trường">
        <div className="gis-title-group">
          <button
            type="button"
            className="gis-sidebar-toggle-btn"
            onClick={() => setSidebarOpen(prev => !prev)}
            title={sidebarOpen ? 'Ẩn danh sách' : 'Hiện danh sách điểm thu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ListFilter size={18} />}
            <span className="btn-text">{sidebarOpen ? 'Thu gọn' : 'Danh sách'}</span>
          </button>
          <div className="gis-live-tag">
            <span className="live-pulse-dot" />
            <span>GIÁM SÁT THỜI GIAN THỰC</span>
          </div>
        </div>

        {/* Telemetry Chips */}
        <div className="gis-telemetry-strip">
          <div className="gis-telemetry-chip" title="Lượng mưa trung bình theo thời gian thực (Open-Meteo)">
            <span className="chip-label">🌧️ Mưa TB:</span>
            <b>{environmentQuery.isLoading ? '…' : envStats.rainAvg ? `${envStats.rainAvg} mm/h` : '0 mm/h'}</b>
          </div>
          <div className="gis-telemetry-chip" title="Độ cao địa hình trung bình (SRTM)">
            <span className="chip-label">⛰️ Cao độ TB:</span>
            <b>{environmentQuery.isLoading ? '…' : envStats.elevationAvg ? `${envStats.elevationAvg} m` : '—'}</b>
          </div>
          <div className="gis-telemetry-chip" title="Chỉ số rủi ro ngập lụt cao nhất trong khu vực">
            <span className="chip-label">⚠️ Rủi ro max:</span>
            <b>{environmentQuery.isLoading ? '…' : envStats.maxRisk ? `${envStats.maxRisk} / 100` : '—'}</b>
          </div>
          <button
            type="button"
            className="gis-action-icon-btn"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới dữ liệu bản đồ"
          >
            <RefreshCw size={15} className={isFetching ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {/* 3. Left Sliding Sidebar: Drain Directory & Filters */}
      <aside className={`gis-sidebar ${sidebarOpen ? 'is-open' : 'is-closed'}`} aria-label="Danh sách miệng cống">
        <div className="gis-sidebar-inner">
          <div className="gis-sidebar-head">
            <div className="gis-sidebar-title-row">
              <h3>Miệng thu nước</h3>
              <span className="gis-count-badge">{displayRecords.length} điểm</span>
            </div>
            <p className="gis-sidebar-sub">Theo dõi tỷ lệ tắc nghẽn và nguy cơ ngập</p>

            {/* Search Input */}
            <div className="gis-search-wrap">
              <Search size={16} className="gis-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, trạng thái..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" className="gis-search-clear" onClick={() => setSearch('')}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="gis-filter-pills">
              <button
                type="button"
                className={`gis-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ALL')}
              >
                Tất cả ({counts.all})
              </button>
              <button
                type="button"
                className={`gis-pill tone-critical ${statusFilter === 'CRITICAL' ? 'active' : ''}`}
                onClick={() => setStatusFilter('CRITICAL')}
              >
                Nguy hiểm ({counts.critical})
              </button>
              <button
                type="button"
                className={`gis-pill tone-high ${statusFilter === 'HIGH' ? 'active' : ''}`}
                onClick={() => setStatusFilter('HIGH')}
              >
                Cảnh báo ({counts.high})
              </button>
              <button
                type="button"
                className={`gis-pill tone-moderate ${statusFilter === 'MODERATE' ? 'active' : ''}`}
                onClick={() => setStatusFilter('MODERATE')}
              >
                Theo dõi ({counts.moderate})
              </button>
              <button
                type="button"
                className={`gis-pill tone-low ${statusFilter === 'LOW' ? 'active' : ''}`}
                onClick={() => setStatusFilter('LOW')}
              >
                Ổn định ({counts.low})
              </button>
            </div>
          </div>

          {/* Drains Scroll List */}
          <div className="gis-sidebar-list">
            {isLoading ? (
              <div className="gis-list-loading">
                <Loader2 size={24} className="spin" />
                <span>Đang tải dữ liệu miệng cống…</span>
              </div>
            ) : displayRecords.length ? (
              displayRecords.map(item => {
                const key = item.latitude!.toFixed(5) + ',' + item.longitude!.toFixed(5);
                const isSelected = selectedKey === key;
                const env = envMap.get(key);
                const address = addressCache[key];

                return (
                  <article
                    key={item.id}
                    className={`gis-drain-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => handleSelectFromList(item)}
                  >
                    <div className="drain-thumb-box">
                      {item.annotated_image_url ? (
                        <img src={files(item.annotated_image_url)} alt="Thumbnail" loading="lazy" />
                      ) : (
                        <div className="drain-thumb-placeholder">
                          <MapPin size={18} />
                        </div>
                      )}
                    </div>
                    <div className="drain-item-info">
                      <div className="drain-item-top">
                        <span className="drain-item-id">Miệng cống #{item.id}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="drain-item-addr" title={address || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}>
                        {address || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                      </div>
                      <div className="drain-item-metrics">
                        <span className="metric-chip">
                          Bít tắc: <b>{item.blockage_percent != null ? `${item.blockage_percent}%` : '—'}</b>
                        </span>
                        {env?.flood_risk_score != null && (
                          <span className="metric-chip risk">
                            Risk: <b>{env.flood_risk_score}/100</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="gis-list-empty">
                <Filter size={28} />
                <p>Không tìm thấy miệng thu nước phù hợp với bộ lọc.</p>
                <button type="button" className="button outline sm" onClick={() => { setStatusFilter('ALL'); setSearch(''); }}>
                  Bỏ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 4. Floating GIS Tools (FABs on Right Canvas) */}
      <div className="gis-fab-group" role="toolbar" aria-label="Công cụ bản đồ">
        {/* Layer Switcher Popover Button */}
        <button
          type="button"
          className={`gis-fab ${layersOpen ? 'is-active' : ''}`}
          onClick={() => setLayersOpen(prev => !prev)}
          title="Lớp bản đồ & Chế độ xem (Layers)"
        >
          <Layers size={19} />
          <span className="fab-tooltip">
            Lớp bản đồ ({mapStyle === 'modern-light' ? 'Đô thị Hiện đại' : mapStyle === 'modern-liberty' ? 'Đô thị Sinh động' : mapStyle === 'satellite' ? 'Vệ tinh Thực địa' : 'Chế độ đêm'})
          </span>
        </button>

        {/* 3D Perspective Tilt Button */}
        <button
          type="button"
          className={`gis-fab ${is3D ? 'is-active' : ''}`}
          onClick={() => setIs3D(prev => !prev)}
          title={is3D ? 'Góc nhìn phẳng 2D' : 'Góc nhìn nghiêng 3D'}
        >
          <Box size={19} />
          <span className="fab-badge">{is3D ? '3D' : '2D'}</span>
          <span className="fab-tooltip">{is3D ? 'Chuyển sang 2D' : 'Góc nhìn 3D'}</span>
        </button>

        {/* Compass / Reset North */}
        <button
          type="button"
          className="gis-fab"
          onClick={handleResetNorth}
          title="Đặt lại hướng Bắc & Góc phẳng"
        >
          <Compass
            size={19}
            className="compass-needle"
            style={{ transform: `rotate(${-bearing}deg)` }}
          />
          <span className="fab-tooltip">Đặt lại hướng Bắc</span>
        </button>

        {/* Fit Bounds */}
        <button
          type="button"
          className="gis-fab"
          onClick={() => setFitBoundsSignal(s => s + 1)}
          title="Thu phóng toàn cảnh các miệng cống"
        >
          <Maximize2 size={19} />
          <span className="fab-tooltip">Xem toàn cảnh</span>
        </button>

        {/* Locate Me */}
        <button
          type="button"
          className={`gis-fab ${locatingUser ? 'is-loading' : ''}`}
          onClick={locateUser}
          disabled={locatingUser}
          title="Định vị vị trí của tôi"
        >
          <Crosshair size={19} className={locatingUser ? 'spin' : ''} />
          <span className="fab-tooltip">Vị trí của tôi</span>
        </button>
      </div>

      {/* 5. Layer Picker Popover Card (Compact Modern Vector Style) */}
      {layersOpen && (
        <div className="gis-layer-picker" role="dialog" aria-label="Bộ chọn lớp bản đồ">
          <div className="gis-layer-picker-head">
            <span className="gis-layer-title-eyebrow">KIỂU BẢN ĐỒ</span>
            <button
              type="button"
              className="gis-layer-close-btn"
              onClick={() => setLayersOpen(false)}
              aria-label="Đóng"
            >
              <X size={14} />
            </button>
          </div>

          <div className="gis-layer-list">
            <button
              type="button"
              className={`gis-layer-row ${mapStyle === 'modern-light' ? 'active' : ''}`}
              onClick={() => setMapStyle('modern-light')}
            >
              <span className="gis-layer-row-icon">💎</span>
              <span className="gis-layer-row-name">Đô thị Hiện đại (Positron)</span>
              {mapStyle === 'modern-light' && <Check size={14} className="gis-layer-check" />}
            </button>

            <button
              type="button"
              className={`gis-layer-row ${mapStyle === 'modern-liberty' ? 'active' : ''}`}
              onClick={() => setMapStyle('modern-liberty')}
            >
              <span className="gis-layer-row-icon">🏙️</span>
              <span className="gis-layer-row-name">Đô thị Sinh động (Liberty)</span>
              {mapStyle === 'modern-liberty' && <Check size={14} className="gis-layer-check" />}
            </button>

            <button
              type="button"
              className={`gis-layer-row ${mapStyle === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapStyle('satellite')}
            >
              <span className="gis-layer-row-icon">🛰️</span>
              <span className="gis-layer-row-name">Vệ tinh Thực địa</span>
              {mapStyle === 'satellite' && <Check size={14} className="gis-layer-check" />}
            </button>

            <button
              type="button"
              className={`gis-layer-row ${mapStyle === 'modern-dark' ? 'active' : ''}`}
              onClick={() => setMapStyle('modern-dark')}
            >
              <span className="gis-layer-row-icon">🌙</span>
              <span className="gis-layer-row-name">Chế độ đêm (Dark IOC)</span>
              {mapStyle === 'modern-dark' && <Check size={14} className="gis-layer-check" />}
            </button>
          </div>

          <div className="gis-layer-divider" />

          {/* Toggle Risk Circles */}
          <div
            className="gis-layer-toggle-row"
            onClick={() => setShowRiskZones(prev => !prev)}
            role="checkbox"
            aria-checked={showRiskZones}
          >
            <span>Vùng cảnh báo ngập</span>
            <div className={`gis-toggle-switch ${showRiskZones ? 'on' : ''}`}>
              <div className="gis-toggle-switch-handle" />
            </div>
          </div>

          {/* Toggle 3D Tilt */}
          <div
            className="gis-layer-toggle-row"
            onClick={() => setIs3D(prev => !prev)}
            role="checkbox"
            aria-checked={is3D}
          >
            <span>Góc nhìn nghiêng 3D</span>
            <div className={`gis-toggle-switch ${is3D ? 'on' : ''}`}>
              <div className="gis-toggle-switch-handle" />
            </div>
          </div>
        </div>
      )}

      {/* 6. Floating Bottom-Left Legend */}
      <div className="gis-legend-card" aria-label="Chú giải bản đồ">
        <div className="gis-legend-title">Mức độ rủi ro</div>
        <div className="gis-legend-items">
          <div className="gis-legend-row">
            <span className="legend-swatch low" />
            <span>Thông thoáng (0-20%)</span>
          </div>
          <div className="gis-legend-row">
            <span className="legend-swatch moderate" />
            <span>Theo dõi (21-50%)</span>
          </div>
          <div className="gis-legend-row">
            <span className="legend-swatch high" />
            <span>Cảnh báo (51-75%)</span>
          </div>
          <div className="gis-legend-row">
            <span className="legend-swatch critical" />
            <span>Nguy hiểm (&gt;75%)</span>
          </div>
        </div>
      </div>

      {/* 7. Selected Drain Inspector Drawer (Detailed Slide-out Panel) */}
      {selectedDrain && (
        <section className="gis-inspector-drawer" aria-label="Chi tiết miệng thu nước">
          <div className="inspector-card">
            {/* Inspector Header */}
            <div className="inspector-head">
              <div>
                <div className="eyebrow">CHI TIẾT ĐIỂM KIỂM TRA</div>
                <h3 className="inspector-title">Miệng cống #{selectedDrain.record.id}</h3>
                <div className="inspector-time">
                  {new Date(selectedDrain.record.created_at).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="inspector-head-actions">
                <StatusBadge status={selectedDrain.record.status} />
                <button
                  type="button"
                  className="inspector-close-btn"
                  onClick={() => setSelectedDrain(null)}
                  aria-label="Đóng bảng chi tiết"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Inspector Image & Toggle */}
            <div className="inspector-photo-section">
              <div className="inspector-photo-box">
                {photoView === 'annotated' ? (
                  selectedDrain.record.annotated_image_url ? (
                    <img src={files(selectedDrain.record.annotated_image_url)} alt="Ảnh phân tích AI" />
                  ) : (
                    <div className="photo-placeholder">Không có ảnh AI</div>
                  )
                ) : selectedDrain.record.original_image_url ? (
                  <img src={files(selectedDrain.record.original_image_url)} alt="Ảnh gốc chụp" />
                ) : (
                  <div className="photo-placeholder">Không có ảnh gốc</div>
                )}
              </div>
              <div className="photo-toggle-bar">
                <button
                  type="button"
                  className={`photo-toggle-btn ${photoView === 'annotated' ? 'active' : ''}`}
                  onClick={() => setPhotoView('annotated')}
                >
                  <Sparkles size={14} /> Ảnh AI phân tích
                </button>
                <button
                  type="button"
                  className={`photo-toggle-btn ${photoView === 'original' ? 'active' : ''}`}
                  onClick={() => setPhotoView('original')}
                >
                  <Eye size={14} /> Ảnh chụp gốc
                </button>
              </div>
            </div>

            {/* Blockage Progress Meter */}
            <div className="inspector-meter-section">
              <div className="meter-label-row">
                <span>Mức độ bít tắc rác</span>
                <b>{selectedDrain.record.blockage_percent != null ? `${selectedDrain.record.blockage_percent}%` : 'Chưa có dữ liệu'}</b>
              </div>
              <div className="meter-track">
                <div
                  className="meter-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, selectedDrain.record.blockage_percent || 0))}%`,
                    backgroundColor: statusColor[selectedDrain.record.status] || '#0879c9',
                  }}
                />
              </div>
            </div>

            {/* Metrics 3-Col Grid */}
            <div className="inspector-grid">
              <div className="inspector-metric-box">
                <span className="box-label">Miệng thu</span>
                <b className="box-val">{selectedDrain.record.drain_count}</b>
              </div>
              <div className="inspector-metric-box">
                <span className="box-label">Độ tin cậy AI</span>
                <b className="box-val">
                  {selectedDrain.record.confidence != null ? `${(selectedDrain.record.confidence * 100).toFixed(0)}%` : '—'}
                </b>
              </div>
              <div className="inspector-metric-box">
                <span className="box-label">Model AI</span>
                <b className="box-val" title={selectedDrain.record.model?.name || 'YOLO'}>
                  {selectedDrain.record.model?.version || 'v0'}
                </b>
              </div>
            </div>

            {/* Environmental Weather & Risk Card */}
            <div className="inspector-env-card">
              <div className="env-card-title">
                <AlertTriangle size={15} />
                <span>Môi trường & Nguy cơ ngập úng</span>
              </div>
              <div className="env-grid">
                <div className="env-item">
                  <span className="env-label">Lượng mưa hiện tại</span>
                  <b className="env-val">
                    {selectedDrain.env?.precipitation_mm_h != null ? `${selectedDrain.env.precipitation_mm_h} mm/h` : '0 mm/h'}
                  </b>
                </div>
                <div className="env-item">
                  <span className="env-label">Cao độ mặt đất</span>
                  <b className="env-val">
                    {selectedDrain.env?.elevation_m != null ? `${selectedDrain.env.elevation_m} m` : '—'}
                  </b>
                </div>
                <div className="env-item">
                  <span className="env-label">Điểm rủi ro ngập</span>
                  <b className="env-val highlight">
                    {selectedDrain.env?.flood_risk_score != null ? `${selectedDrain.env.flood_risk_score} / 100` : '—'}
                  </b>
                </div>
              </div>
            </div>

            {/* Address & GPS Location */}
            <div className="inspector-location-card">
              <div className="location-row">
                <MapPin size={18} className="location-pin-icon" />
                <div className="location-text">
                  <b>{addressCache[selectedKey || ''] || (fetchingAddress ? 'Đang tra cứu địa chỉ…' : 'Địa chỉ tọa độ GPS')}</b>
                  <span>
                    Tọa độ: {selectedDrain.record.latitude?.toFixed(6)}, {selectedDrain.record.longitude?.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="inspector-actions">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedDrain.record.latitude},${selectedDrain.record.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button outline sm inspector-action-btn"
              >
                <NavigationIcon size={15} />
                <span>Chỉ đường Google Maps</span>
                <ExternalLink size={13} />
              </a>

              <Link
                href="/analyze"
                className="button sm inspector-action-btn primary"
              >
                <Camera size={15} />
                <span>Kiểm tra lại điểm này</span>
              </Link>
            </div>

            {/* History at this spot */}
            {selectedDrain.group.length > 1 && (
              <div className="inspector-history-section">
                <div className="history-head-label">
                  Lịch sử tại điểm này ({selectedDrain.group.length} lần kiểm tra)
                </div>
                <div className="history-mini-list">
                  {selectedDrain.group
                    .slice()
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(h => (
                      <div key={h.id} className="history-mini-item">
                        <div>
                          <b>#{h.id}</b>
                          <span>{new Date(h.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="history-mini-status">
                          <span>{h.blockage_percent != null ? `${h.blockage_percent}%` : '—'}</span>
                          <StatusBadge status={h.status} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
