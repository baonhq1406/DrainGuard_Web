'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  ExternalLink,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '@/services/api';

type Dataset = {
  id: number;
  name: string;
  version: string;
  task: string;
  classes_json: string[];
  image_count: number;
  train_count: number;
  val_count: number;
  test_count: number;
  source?: string | null;
  description?: string | null;
};

const emptyForm = {
  name: '',
  version: '',
  task: 'segment',
  classes: 'drain, debris',
  image_count: '0',
  train_count: '0',
  val_count: '0',
  test_count: '0',
  source: '',
  description: '',
};

const CORPUS_PREVIEWS = [
  { img: '/demo/drain-sample-2.jpg', label: 'RAW Input · Hùng Vương', tag: 'Train Set', color: '#00f2fe' },
  { img: '/demo/drain-annotated-2.jpg', label: 'Polygon Mask · Debris 78%', tag: 'Ground Truth', color: '#ef4444' },
  { img: '/demo/drain-raw.jpg', label: 'RAW Input · Lê Duẩn', tag: 'Validation Set', color: '#10b981' },
  { img: '/demo/drain-annotated.jpg', label: 'Polygon Mask · Leaves 41%', tag: 'Ground Truth', color: '#f59e0b' },
];

export default function Datasets() {
  const qc = useQueryClient();
  const { data = [], error, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api<Dataset[]>('/datasets'),
  });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Dataset>();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  function set(key: keyof typeof emptyForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function fromDataset(x: Dataset) {
    setEditing(x);
    setShowForm(true);
    setForm({
      name: x.name,
      version: x.version,
      task: x.task,
      classes: x.classes_json.join(', '),
      image_count: String(x.image_count),
      train_count: String(x.train_count),
      val_count: String(x.val_count),
      test_count: String(x.test_count),
      source: x.source || '',
      description: x.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function payload() {
    return {
      name: form.name.trim(),
      version: form.version.trim(),
      task: form.task,
      classes_json: form.classes
        .split(',')
        .map(x => x.trim())
        .filter(Boolean),
      image_count: Number(form.image_count) || 0,
      train_count: Number(form.train_count) || 0,
      val_count: Number(form.val_count) || 0,
      test_count: Number(form.test_count) || 0,
      source: form.source.trim() || null,
      description: form.description.trim() || null,
    };
  }

  async function save() {
    if (!form.name.trim() || !form.version.trim()) {
      setMessage('Vui lòng nhập tên và version dataset.');
      return;
    }
    try {
      await api(editing ? '/datasets/' + editing.id : '/datasets', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      setMessage(editing ? 'Đã cập nhật dataset.' : 'Đã thêm dataset mới.');
      setEditing(undefined);
      setForm(emptyForm);
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['datasets'] });
      qc.invalidateQueries({ queryKey: ['models'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không thể lưu dataset');
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Xóa dataset này?')) return;
    try {
      await api('/datasets/' + id, { method: 'DELETE' });
      setMessage('Đã xóa dataset.');
      if (editing?.id === id) {
        setEditing(undefined);
        setForm(emptyForm);
      }
      qc.invalidateQueries({ queryKey: ['datasets'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không thể xóa dataset');
    }
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
              <span>TRAINING CORPUS &amp; ANNOTATION MATRIX</span>
            </div>
            <h1 className="admin-cyber-title">
              Kho dữ liệu <span className="title-glow-cyan">Huấn luyện AI</span>
            </h1>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="btn-glow-primary"
              style={{ padding: '10px 18px', fontSize: '13.5px' }}
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  setEditing(undefined);
                  setForm(emptyForm);
                } else {
                  setShowForm(true);
                }
              }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showForm ? 'Đóng biểu mẫu' : 'Đăng ký Dataset mới'}</span>
            </button>
          </div>
        </div>

        {/* Visual Training Corpus Sample Strip */}
        <section className="corpus-visual-strip">
          {CORPUS_PREVIEWS.map((item, idx) => (
            <div key={idx} className="corpus-preview-card">
              <img src={item.img} alt={item.label} />
              <div className="marquee-hover-scan" />
              <div className="corpus-preview-overlay">
                <span className="corpus-tag" style={{ color: item.color }}>● {item.tag}</span>
                <span className="corpus-label">{item.label}</span>
              </div>
            </div>
          ))}
        </section>

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

        {/* Collapsible Add / Edit Dataset Form */}
        {showForm && (
          <section className="admin-glass-panel" style={{ marginBottom: '26px', borderColor: '#00f2fe' }}>
            <div className="admin-panel-head">
              <div>
                <span className="admin-eyebrow">{editing ? 'UPDATE CORPUS' : 'NEW CORPUS'}</span>
                <h2 className="admin-panel-title">
                  {editing ? `Chỉnh sửa: ${editing.name}` : 'Đăng Ký Phiên Bản Dataset Mới'}
                </h2>
              </div>
            </div>

            <div className="cyber-form-grid">
              <div className="cyber-field">
                <label htmlFor="ds-name">Tên Dataset *</label>
                <input
                  id="ds-name"
                  className="cyber-input"
                  placeholder="VD: Danang-Urban-Drain-Seg"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-version">Version *</label>
                <input
                  id="ds-version"
                  className="cyber-input"
                  placeholder="VD: v3.0"
                  value={form.version}
                  onChange={e => set('version', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-task">Tác vụ (Task)</label>
                <select
                  id="ds-task"
                  className="cyber-input"
                  value={form.task}
                  onChange={e => set('task', e.target.value)}
                >
                  <option value="segment">segment (Polygon Mask)</option>
                  <option value="detect">detect (Bounding Box)</option>
                </select>
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-classes">Nhãn (Classes)</label>
                <input
                  id="ds-classes"
                  className="cyber-input"
                  placeholder="drain, debris"
                  value={form.classes}
                  onChange={e => set('classes', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-total">Tổng số ảnh</label>
                <input
                  id="ds-total"
                  type="number"
                  min="0"
                  className="cyber-input"
                  value={form.image_count}
                  onChange={e => set('image_count', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-train">Tập Train</label>
                <input
                  id="ds-train"
                  type="number"
                  min="0"
                  className="cyber-input"
                  value={form.train_count}
                  onChange={e => set('train_count', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-val">Tập Validation</label>
                <input
                  id="ds-val"
                  type="number"
                  min="0"
                  className="cyber-input"
                  value={form.val_count}
                  onChange={e => set('val_count', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-test">Tập Test</label>
                <input
                  id="ds-test"
                  type="number"
                  min="0"
                  className="cyber-input"
                  value={form.test_count}
                  onChange={e => set('test_count', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-source">Nguồn / Roboflow URL</label>
                <input
                  id="ds-source"
                  className="cyber-input"
                  placeholder="https://universe.roboflow.com/..."
                  value={form.source}
                  onChange={e => set('source', e.target.value)}
                />
              </div>
              <div className="cyber-field">
                <label htmlFor="ds-desc">Ghi chú</label>
                <input
                  id="ds-desc"
                  className="cyber-input"
                  placeholder="Mô tả ngắn gọn..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button type="button" className="btn-glow-primary" onClick={save}>
                <span>{editing ? 'Lưu cập nhật' : 'Lưu Dataset'}</span>
              </button>
              <button
                type="button"
                className="admin-quick-chip"
                onClick={() => {
                  setEditing(undefined);
                  setForm(emptyForm);
                  setShowForm(false);
                }}
              >
                <span>Hủy</span>
              </button>
            </div>
          </section>
        )}

        {/* Datasets Visual Cards Grid */}
        <section>
          <div className="admin-panel-head" style={{ marginBottom: '16px' }}>
            <div>
              <span className="admin-eyebrow">REGISTERED DATASETS</span>
              <h2 className="admin-panel-title">
                Danh Sách Tập Dữ Liệu ({isLoading ? '...' : data.length})
              </h2>
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#38bdf8' }}>
              <Loader2 size={34} className="spin" style={{ margin: '0 auto 10px' }} />
              <div>Đang tải dữ liệu Datasets...</div>
            </div>
          ) : data.length ? (
            <div className="neural-models-grid">
              {data.map(ds => {
                const total = Math.max(1, ds.image_count || ds.train_count + ds.val_count + ds.test_count);
                const trPct = Math.round((ds.train_count / total) * 100);
                const valPct = Math.round((ds.val_count / total) * 100);
                const tePct = Math.max(0, 100 - trPct - valPct);

                return (
                  <div key={ds.id} className="neural-model-card">
                    <div className="neural-card-top">
                      <div className="neural-core-badge" style={{ color: '#10b981' }}>
                        <Layers size={21} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3 className="neural-model-name">{ds.name}</h3>
                          <span className="version-neon-chip">{ds.version}</span>
                        </div>
                        {ds.description && <div className="neural-model-desc">{ds.description}</div>}
                      </div>
                      <span className="engine-status-pill">{ds.image_count} ẢNH</span>
                    </div>

                    {/* Visual Segmented Split Bar (Train / Val / Test) */}
                    <div className="dataset-split-box">
                      <div className="dataset-split-labels">
                        <span style={{ color: '#00f2fe' }}>● Train: <b>{ds.train_count}</b></span>
                        <span style={{ color: '#10b981' }}>● Val: <b>{ds.val_count}</b></span>
                        <span style={{ color: '#f59e0b' }}>● Test: <b>{ds.test_count}</b></span>
                      </div>
                      <div className="dataset-split-track">
                        <div style={{ width: `${trPct}%`, background: '#00f2fe' }} />
                        <div style={{ width: `${valPct}%`, background: '#10b981' }} />
                        <div style={{ width: `${tePct}%`, background: '#f59e0b' }} />
                      </div>
                    </div>

                    <div className="neural-specs-row">
                      <span className="neural-spec-chip">Task: <b>{ds.task}</b></span>
                      <span className="neural-spec-chip">
                        Classes: <b>{ds.classes_json.join(', ') || '—'}</b>
                      </span>
                    </div>

                    <div className="neural-card-actions">
                      {ds.source && (
                        <a
                          href={ds.source}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-quick-chip"
                        >
                          <ExternalLink size={13} />
                          <span>Nguồn</span>
                        </a>
                      )}
                      <button
                        type="button"
                        className="admin-quick-chip"
                        onClick={() => fromDataset(ds)}
                      >
                        <Pencil size={13} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        type="button"
                        className="admin-quick-chip danger-hover"
                        onClick={() => remove(ds.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-glass-panel" style={{ textAlign: 'center', padding: '54px 20px' }}>
              <Database size={38} style={{ color: '#10b981', margin: '0 auto 12px' }} />
              <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
                Chưa có Dataset nào được đăng ký
              </h3>
              <button
                type="button"
                className="btn-glow-primary"
                style={{ marginTop: '10px' }}
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} />
                <span>Đăng ký Dataset đầu tiên</span>
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
