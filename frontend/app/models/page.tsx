'use client';

import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Boxes,
  CheckCircle2,
  Cpu,
  Download,
  FlaskConical,
  Loader2,
  Plus,
  Power,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { api, files } from '@/services/api';
import { StatusBadge } from '@/components/ui';
import type { Model, ModelTestResponse } from '@/types';

const TEST_SAMPLES = [
  { title: 'Hùng Vương (78%)', url: '/demo/drain-sample-2.jpg', name: 'sample-hung-vuong.jpg' },
  { title: 'Lê Duẩn (41%)', url: '/demo/drain-raw.jpg', name: 'sample-le-duan.jpg' },
  { title: 'Chợ Cồn (64%)', url: '/demo/drain-sample-4.jpg', name: 'sample-cho-con.jpg' },
  { title: 'Bạch Đằng (0%)', url: '/demo/drain-sample-5.jpg', name: 'sample-bach-dang.jpg' },
];

export default function Models() {
  const qc = useQueryClient();
  const { data = [], error, isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => api<Model[]>('/models'),
  });
  const { data: datasets = [] } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api<{ id: number; name: string; version: string }[]>('/datasets'),
  });

  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File>();
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [imgsz, setImgsz] = useState('1024');
  const [datasetId, setDatasetId] = useState('');
  const [metricsJson, setMetricsJson] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);

  const [testModel, setTestModel] = useState<Model>();
  const [testFile, setTestFile] = useState<File>();
  const [testResult, setTestResult] = useState<ModelTestResponse>();
  const [testing, setTesting] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const splitRef = useRef<HTMLDivElement>(null);

  async function upload() {
    if (!file || !name || !version) {
      setMessage('Vui lòng nhập tên model, version và chọn file .pt.');
      return;
    }

    const f = new FormData();
    f.append('file', file);
    f.append('name', name);
    f.append('version', version);
    if (description.trim()) f.append('description', description.trim());
    if (imgsz.trim()) f.append('imgsz', imgsz.trim());
    if (datasetId) f.append('training_dataset_id', datasetId);
    if (metricsJson.trim()) f.append('metrics_json', metricsJson.trim());

    try {
      setUploading(true);
      setMessage('Đang upload và validate model...');
      await api('/models/upload', { method: 'POST', body: f });
      setMessage('Đã upload và validate model. Model đang ở trạng thái READY.');
      setFile(undefined);
      setName('');
      setVersion('');
      setDescription('');
      setDatasetId('');
      setMetricsJson('');
      setShowUpload(false);
      qc.invalidateQueries({ queryKey: ['models'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  }

  async function activate(id: number) {
    try {
      await api('/models/' + id + '/activate', { method: 'POST' });
      qc.invalidateQueries({ queryKey: ['models'] });
      setMessage('Đã kích hoạt model thành công.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không thể kích hoạt');
    }
  }

  async function archive(id: number) {
    if (!window.confirm('Lưu trữ model này?')) return;
    try {
      await api('/models/' + id, { method: 'DELETE' });
      qc.invalidateQueries({ queryKey: ['models'] });
      setMessage('Đã lưu trữ model.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không thể lưu trữ');
    }
  }

  async function runTest(overrideFile?: File) {
    const targetFile = overrideFile || testFile;
    if (!testModel || !targetFile) return;
    const f = new FormData();
    f.append('image', targetFile);
    setTesting(true);
    setTestResult(undefined);
    try {
      const result = await api<ModelTestResponse>('/models/' + testModel.id + '/test', {
        method: 'POST',
        body: f,
      });
      setTestResult(result);
      setSliderPos(50);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Test model thất bại');
    } finally {
      setTesting(false);
    }
  }

  async function pickSampleAndTest(sample: typeof TEST_SAMPLES[0]) {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const sampled = new File([blob], sample.name, { type: 'image/jpeg' });
      setTestFile(sampled);
      await runTest(sampled);
    } catch (err) {
      console.error(err);
    }
  }

  function handleSplitMove(clientX: number) {
    if (!splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }

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
              <span>NEURAL ENGINE REGISTRY · ULTRALYTICS YOLO</span>
            </div>
            <h1 className="admin-cyber-title">
              Quản trị <span className="title-glow-cyan">AI Models (.pt)</span>
            </h1>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="btn-glow-primary"
              style={{ padding: '10px 18px', fontSize: '13.5px' }}
              onClick={() => setShowUpload(prev => !prev)}
            >
              {showUpload ? <X size={16} /> : <Plus size={16} />}
              <span>{showUpload ? 'Đóng khung Upload' : 'Triển khai Model (.pt) mới'}</span>
            </button>
          </div>
        </div>

        {message && (
          <div className="admin-cyber-alert info" role="status">
            <Sparkles size={16} />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="admin-cyber-alert error" role="alert">
            <span>{error.message}</span>
          </div>
        )}

        {/* Collapsible Deploy New Model Studio */}
        {showUpload && (
          <section className="admin-glass-panel" style={{ marginBottom: '26px', borderColor: 'rgba(0, 242, 254, 0.4)' }}>
            <div className="admin-panel-head">
              <div>
                <span className="admin-eyebrow">DEPLOY NEURAL WEIGHTS</span>
                <h2 className="admin-panel-title">Tải Lên &amp; Kiểm Định Trọng Số (.pt)</h2>
              </div>
            </div>

            <div className="cyber-form-grid">
              <div className="cyber-field">
                <label htmlFor="md-name">Tên Model *</label>
                <input
                  id="md-name"
                  className="cyber-input"
                  placeholder="VD: yolo26l-seg"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="md-version">Version *</label>
                <input
                  id="md-version"
                  className="cyber-input"
                  placeholder="VD: v1-seg"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="md-imgsz">Độ phân giải (imgsz)</label>
                <input
                  id="md-imgsz"
                  className="cyber-input"
                  placeholder="1024"
                  value={imgsz}
                  onChange={e => setImgsz(e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="md-dataset">Dataset Huấn luyện</label>
                <select
                  id="md-dataset"
                  className="cyber-input"
                  value={datasetId}
                  onChange={e => setDatasetId(e.target.value)}
                >
                  <option value="">-- Chọn Dataset (Tùy chọn) --</option>
                  {datasets.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} · {d.version}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cyber-field">
                <label htmlFor="md-file">Tệp Trọng Số (.pt) *</label>
                <input
                  id="md-file"
                  type="file"
                  accept=".pt"
                  className="cyber-file-input"
                  onChange={e => {
                    const selected = e.target.files?.[0];
                    setFile(selected);
                    if (selected && !name.trim()) {
                      setName(selected.name.replace(/\.pt$/i, ''));
                    }
                    if (selected && !version.trim()) {
                      setVersion('v1-seg');
                    }
                  }}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="md-metrics">Metrics JSON</label>
                <input
                  id="md-metrics"
                  className="cyber-input"
                  placeholder='{"mAP50": 0.94}'
                  value={metricsJson}
                  onChange={e => setMetricsJson(e.target.value)}
                />
              </div>
              <div className="cyber-field full">
                <label htmlFor="md-desc">Ghi chú kỹ thuật</label>
                <input
                  id="md-desc"
                  className="cyber-input"
                  placeholder="Ghi chú kiến trúc / thông số huấn luyện"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '18px' }}>
              <button type="button" className="btn-glow-primary" onClick={upload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Đang nạp &amp; kiểm định...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload &amp; Validate (.pt)</span>
                  </>
                )}
              </button>
              {file && (
                <span style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 700 }}>
                  📦 {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              )}
            </div>
          </section>
        )}

        {/* Interactive Model Sandbox Test Lab */}
        {testModel && (
          <section className="admin-glass-panel" style={{ marginBottom: '26px', borderColor: '#00f2fe' }}>
            <div className="admin-panel-head">
              <div>
                <span className="admin-eyebrow">OPTICAL SANDBOX LAB</span>
                <h2 className="admin-panel-title">
                  Thử Nghiệm Trực Tiếp: {testModel.name} ({testModel.version})
                </h2>
              </div>
              <button
                type="button"
                className="admin-quick-chip"
                onClick={() => {
                  setTestModel(undefined);
                  setTestResult(undefined);
                }}
              >
                <X size={15} />
                <span>Đóng Lab</span>
              </button>
            </div>

            {/* 1-Click Quick Samples + Custom File Upload */}
            <div className="sandbox-controls-bar">
              <div className="sandbox-samples-row">
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8' }}>⚡ TEST NHANH 1 CHẠM:</span>
                {TEST_SAMPLES.map(s => (
                  <button
                    key={s.name}
                    type="button"
                    className="sandbox-sample-btn"
                    onClick={() => pickSampleAndTest(s)}
                    disabled={testing}
                  >
                    <img src={s.url} alt={s.title} />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Chọn ảnh để test"
                  className="cyber-file-input"
                  style={{ maxWidth: '240px' }}
                  onChange={e => setTestFile(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn-glow-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  disabled={!testFile || testing}
                  onClick={() => runTest()}
                >
                  {testing ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      <span>Đang suy luận...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical size={15} />
                      <span>Chạy Suy Luận</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {testResult && (
              <div style={{ marginTop: '20px' }}>
                <div className="admin-kpi-grid" style={{ marginBottom: '18px' }}>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">MIỆNG THU PHÁT HIỆN</span>
                    <div className="kpi-pod-value">{testResult.result.drain_count}</div>
                  </div>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">ĐỘ TIN CẬY (CONFIDENCE)</span>
                    <div className="kpi-pod-value" style={{ color: '#00f2fe' }}>
                      {testResult.result.confidence == null
                        ? '—'
                        : `${(testResult.result.confidence * 100).toFixed(1)}%`}
                    </div>
                  </div>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">TỶ LỆ BÍT TẮC</span>
                    <div className="kpi-pod-value" style={{ color: '#f97316' }}>
                      {testResult.result.blockage_percent == null ? '—' : `${testResult.result.blockage_percent}%`}
                    </div>
                  </div>
                  <div className="admin-kpi-pod">
                    <span className="kpi-pod-label">TRẠNG THÁI CẢNH BÁO</span>
                    <div style={{ marginTop: '10px' }}>
                      <StatusBadge status={testResult.result.status} />
                    </div>
                  </div>
                </div>

                {/* Interactive Split-Screen Slider for Model Test Result */}
                <div
                  ref={splitRef}
                  className="stage-slider-viewport"
                  style={{ maxHeight: '440px', borderRadius: '18px', border: '1px solid rgba(0, 242, 254, 0.35)' }}
                  onMouseMove={e => handleSplitMove(e.clientX)}
                  onTouchMove={e => handleSplitMove(e.touches[0].clientX)}
                >
                  <img src={files(testResult.original_image_url)} alt="Ảnh gốc" className="stage-img-raw" />
                  <div
                    className="stage-img-overlay-clip"
                    style={{ clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)` }}
                  >
                    <img
                      src={files(testResult.annotated_image_url)}
                      alt="Ảnh AI Annotate"
                      className="stage-img-annotated"
                    />
                    <div className="ai-zone-scanline" />
                  </div>
                  <div className="stage-divider" style={{ left: `${sliderPos}%` }}>
                    <div className="stage-handle">
                      <span>↔</span>
                    </div>
                  </div>
                  <div className="stage-tag stage-tag-left">📷 Ảnh Gốc</div>
                  <div className="stage-tag stage-tag-right">✨ AI {testModel.version}</div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Neural Engine Cards Grid */}
        <section>
          <div className="admin-panel-head" style={{ marginBottom: '16px' }}>
            <div>
              <span className="admin-eyebrow">MODEL FLEET</span>
              <h2 className="admin-panel-title">
                Danh Sách Neural Engines ({isLoading ? '...' : data.length})
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8' }}>
              <Loader2 size={34} className="spin" style={{ margin: '0 auto 10px' }} />
              <div>Đang tải danh sách AI Models...</div>
            </div>
          ) : data.length ? (
            <div className="neural-models-grid">
              {data.map(m => (
                <div
                  key={m.id}
                  className={`neural-model-card ${m.is_active ? 'is-active-engine' : ''}`}
                >
                  <div className="neural-card-top">
                    <div className="neural-core-badge">
                      <Cpu size={22} className={m.is_active ? 'spin-slow' : ''} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3 className="neural-model-name">{m.name}</h3>
                        <span className="version-neon-chip">{m.version}</span>
                      </div>
                      {m.description && <div className="neural-model-desc">{m.description}</div>}
                    </div>
                    {m.is_active ? (
                      <span className="engine-status-pill active">
                        <CheckCircle2 size={13} />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span className="engine-status-pill">{m.status}</span>
                    )}
                  </div>

                  {/* Specs Pills */}
                  <div className="neural-specs-row">
                    <span className="neural-spec-chip">Task: <b>{m.task || 'segment'}</b></span>
                    <span className="neural-spec-chip">imgsz: <b>{m.imgsz ?? 1024}</b></span>
                    <span className="neural-spec-chip">
                      Classes: <b>{m.classes_json?.join(', ') || 'drain, debris'}</b>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="neural-card-actions">
                    {(m.status === 'READY' || m.status === 'ACTIVE') && (
                      <button
                        type="button"
                        className="admin-quick-chip"
                        onClick={() => {
                          setTestModel(m);
                          setTestResult(undefined);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <FlaskConical size={14} className="text-sky-400" />
                        <span>Test Lab</span>
                      </button>
                    )}

                    {!m.is_active && m.status === 'READY' && (
                      <button
                        type="button"
                        className="btn-glow-primary"
                        style={{ padding: '7px 14px', fontSize: '12.5px' }}
                        onClick={() => activate(m.id)}
                      >
                        <Power size={14} />
                        <span>Activate</span>
                      </button>
                    )}

                    <a
                      className="admin-quick-chip"
                      href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/models/${m.id}/download`}
                    >
                      <Download size={14} />
                      <span>.pt</span>
                    </a>

                    {!m.is_active && m.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        className="admin-quick-chip danger-hover"
                        onClick={() => archive(m.id)}
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-glass-panel" style={{ textAlign: 'center', padding: '54px 20px' }}>
              <Boxes size={38} style={{ color: '#38bdf8', margin: '0 auto 12px' }} />
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
                Chưa có AI Model nào trong Registry
              </h3>
              <button
                type="button"
                className="btn-glow-primary"
                style={{ marginTop: '10px' }}
                onClick={() => setShowUpload(true)}
              >
                <Plus size={16} />
                <span>Triển khai Model (.pt) đầu tiên</span>
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
