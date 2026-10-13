'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Download, FlaskConical, Loader2, Power, Upload } from 'lucide-react';
import { api, files } from '@/services/api';
import { EmptyState, ModelStatusBadge, StatusBadge, TableSkeleton, noticeClass } from '@/components/ui';
import type { Model, ModelTestResponse } from '@/types';

export default function Models() {
  const qc = useQueryClient();
  const { data = [], error, isLoading } = useQuery({ queryKey: ['models'], queryFn: () => api<Model[]>('/models') });
  const { data: datasets = [] } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => api<{ id: number; name: string; version: string }[]>('/datasets'),
  });

  const [file, setFile] = useState<File>();
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [description, setDescription] = useState('');
  const [imgsz, setImgsz] = useState('1024');
  const [datasetId, setDatasetId] = useState('');
  const [metricsJson, setMetricsJson] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false); // UI: chặn bấm trùng khi đang upload
  const [testModel, setTestModel] = useState<Model>();
  const [testFile, setTestFile] = useState<File>();
  const [testResult, setTestResult] = useState<ModelTestResponse>();
  const [testing, setTesting] = useState(false);

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
      setMessage('Đã kích hoạt model.');
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

  async function runTest() {
    if (!testModel || !testFile) return;
    const f = new FormData();
    f.append('image', testFile);
    setTesting(true);
    setTestResult(undefined);
    try {
      const result = await api<ModelTestResponse>('/models/' + testModel.id + '/test', {
        method: 'POST',
        body: f,
      });
      setTestResult(result);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Test model thất bại');
    } finally {
      setTesting(false);
    }
  }

  return (
    <main id="main" className="main">
      <h1 className="title">AI Models</h1>
      <p className="lead">Registry quản lý version, validate, test, kích hoạt và rollback model YOLO.</p>

      <section className="panel">
        <h2>Upload model mới</h2>
        <p className="label" style={{ marginBottom: 14 }}>Chọn file <b>.pt</b>, hệ thống sẽ load thử bằng Ultralytics và không tự kích hoạt.</p>
        <div className="form-grid">
          <div className="field"><label htmlFor="md-name">Tên model *</label><input id="md-name" placeholder="Tên model" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="md-version">Version *</label><input id="md-version" placeholder="Version, ví dụ v1" value={version} onChange={e => setVersion(e.target.value)} /></div>
          <div className="field"><label htmlFor="md-imgsz">imgsz</label><input id="md-imgsz" placeholder="imgsz, mặc định 1024" value={imgsz} onChange={e => setImgsz(e.target.value)} /></div>
          <div className="field"><label htmlFor="md-dataset">Dataset training</label>
            <select id="md-dataset" value={datasetId} onChange={e => setDatasetId(e.target.value)}>
              <option value="">Dataset training (tùy chọn)</option>
              {datasets.map(d => <option key={d.id} value={d.id}>{d.name} · {d.version}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="md-file">File model (.pt) *</label><input id="md-file" type="file" accept=".pt" onChange={e => setFile(e.target.files?.[0])} /></div>
          <div className="field"><label htmlFor="md-metrics">Metrics JSON</label><input id="md-metrics" placeholder='Metrics JSON, ví dụ {"mAP50":0.8}' value={metricsJson} onChange={e => setMetricsJson(e.target.value)} /></div>
          <div className="field full"><label htmlFor="md-desc">Mô tả</label><textarea id="md-desc" placeholder="Mô tả model (tùy chọn)" value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
        </div>
        {file && <p className="label" style={{ marginTop: 10 }}>File: {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
        <div className="form-actions">
          <button className="button" onClick={upload} disabled={uploading}>{uploading ? <><Loader2 size={17} className="spin" />Đang upload...</> : <><Upload size={17} />Upload & Validate</>}</button>
        </div>
        {message && <div className={noticeClass(message)} role="status">{message}</div>}
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Danh sách model</h2><span className="label">{isLoading ? 'Đang tải…' : data.length + ' model'}</span></div>
        {error && <div className="notice error" role="alert">{error.message}</div>}
        {isLoading ? <TableSkeleton /> : data.length ? (
          <div className="table-wrap">
            <table className="rtable">
              <thead>
                <tr><th>Tên</th><th>Version</th><th>Task</th><th>Classes</th><th>imgsz</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {data.map(m => (
                  <tr key={m.id} className={m.is_active ? 'is-selected' : ''}>
                    <td data-label="Tên">
                      <b>{m.name}</b>
                      {m.description && <div className="cell-sub">{m.description}</div>}
                    </td>
                    <td data-label="Version">{m.version}</td>
                    <td data-label="Task">{m.task || '—'}</td>
                    <td data-label="Classes">{m.classes_json?.join(', ') || '—'}</td>
                    <td data-label="imgsz">{m.imgsz ?? '—'}</td>
                    <td data-label="Trạng thái"><ModelStatusBadge status={m.status} active={m.is_active} /></td>
                    <td data-label="">
                      <div className="cell-actions">
                        {(m.status === 'READY' || m.status === 'ACTIVE') && (
                          <button className="button outline sm" onClick={() => { setTestModel(m); setTestResult(undefined); }}><FlaskConical size={14} />Test</button>
                        )}
                        {!m.is_active && m.status === 'READY' && <button className="button sm" onClick={() => activate(m.id)}><Power size={14} />Activate</button>}
                        {!m.is_active && m.status !== 'ARCHIVED' && <button className="button outline danger sm" onClick={() => archive(m.id)}><Archive size={14} />Archive</button>}
                        <a className="button outline sm" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/models/${m.id}/download`}><Download size={14} />Download</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Chưa có model">Upload file .pt ở phía trên để bắt đầu.</EmptyState>}
      </section>

      {testModel && (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Test model: {testModel.name} {testModel.version}</h2>
              <p className="label">{testModel.task || '—'} · {testModel.classes_json?.join(', ') || '—'}</p>
            </div>
            <button className="button outline" onClick={() => { setTestModel(undefined); setTestResult(undefined); }}>Đóng</button>
          </div>

          <div className="upload test-drop">
            <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Chọn ảnh để test" onChange={e => setTestFile(e.target.files?.[0])} />
            <button className="button" disabled={!testFile || testing} onClick={runTest}>
              {testing ? <><Loader2 size={17} className="spin" />Đang test...</> : 'Chạy test'}
            </button>
          </div>

          {testResult && (
            <div style={{ marginTop: 18 }}>
              <div className="grid">
                {[
                  ['Drain', testResult.result.drain_count],
                  ['Confidence', testResult.result.confidence == null ? '—' : `${(testResult.result.confidence * 100).toFixed(1)}%`],
                  ['Blockage', testResult.result.blockage_percent == null ? '—' : `${testResult.result.blockage_percent}%`],
                ].map(([k, v]) => <div className="card" key={String(k)}><div className="label">{k}</div><div className="metric">{v}</div></div>)}
                <div className="card"><div className="label">Trạng thái</div><div style={{ marginTop: 12 }}><StatusBadge status={testResult.result.status} /></div></div>
              </div>
              <div className="detail-grid">
                <div className="img-frame">
                  <div className="label">Ảnh gốc</div>
                  <img src={files(testResult.original_image_url)} alt="Ảnh gốc test" />
                </div>
                <div className="img-frame">
                  <div className="label">Ảnh AI annotate</div>
                  <img src={files(testResult.annotated_image_url)} alt="Ảnh AI annotate" />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
