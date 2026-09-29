'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, files } from '@/services/api';
import type { Model, ModelTestResponse } from '@/types';

export default function Models() {
  const qc = useQueryClient();
  const { data = [], error } = useQuery({ queryKey: ['models'], queryFn: () => api<Model[]>('/models') });
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
    <main className="main">
      <h1 className="title">AI Models</h1>
      <p className="lead">Registry quản lý version, validate, test, kích hoạt và rollback model YOLO.</p>

      <section className="panel">
        <h2>Upload model mới</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
          <input placeholder="Tên model" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Version, ví dụ v1" value={version} onChange={e => setVersion(e.target.value)} />
          <input placeholder="imgsz, mặc định 1024" value={imgsz} onChange={e => setImgsz(e.target.value)} />
          <select value={datasetId} onChange={e => setDatasetId(e.target.value)}>
            <option value="">Dataset training (tùy chọn)</option>
            {datasets.map(d => <option key={d.id} value={d.id}>{d.name} · {d.version}</option>)}
          </select>
          <input type="file" accept=".pt" onChange={e => setFile(e.target.files?.[0])} />
          <input placeholder='Metrics JSON, ví dụ {"mAP50":0.8}' value={metricsJson} onChange={e => setMetricsJson(e.target.value)} />
        </div>
        <textarea
          placeholder="Mô tả model (tùy chọn)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          style={{ width: '100%', marginTop: 10, padding: 10, borderRadius: 9, border: '1px solid #d9e6ef' }}
        />
        {file && <p className="label" style={{ marginTop: 10 }}>File: {file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
        <button className="button" onClick={upload}>Upload & Validate</button>
        {message && <div className="notice">{message}</div>}
      </section>

      <section className="panel">
        <h2>Danh sách model</h2>
        {error && <div className="notice">{error.message}</div>}
        {data.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Tên</th><th>Version</th><th>Task</th><th>Classes</th><th>imgsz</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {data.map(m => (
                  <tr key={m.id}>
                    <td>
                      <b>{m.name}</b>
                      {m.description && <div className="label">{m.description}</div>}
                    </td>
                    <td>{m.version}</td>
                    <td>{m.task || '—'}</td>
                    <td>{m.classes_json?.join(', ') || '—'}</td>
                    <td>{m.imgsz ?? '—'}</td>
                    <td><span className={'status ' + (m.is_active ? 'LOW' : 'MODEL_LIMITED')}>{m.is_active ? 'ACTIVE' : m.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(m.status === 'READY' || m.status === 'ACTIVE') && (
                          <button className="button outline" onClick={() => { setTestModel(m); setTestResult(undefined); }}>Test</button>
                        )}
                        {!m.is_active && m.status === 'READY' && <button className="button" onClick={() => activate(m.id)}>Activate</button>}
                        {!m.is_active && m.status !== 'ARCHIVED' && <button className="button outline" onClick={() => archive(m.id)}>Archive</button>}
                        <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/models/${m.id}/download`}>Download</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="lead">Chưa có model.</p>}
      </section>

      {testModel && (
        <section className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <div>
              <h2>Test model: {testModel.name} {testModel.version}</h2>
              <p className="label">{testModel.task || '—'} · {testModel.classes_json?.join(', ') || '—'}</p>
            </div>
            <button className="button outline" onClick={() => { setTestModel(undefined); setTestResult(undefined); }}>Đóng</button>
          </div>

          <div className="upload" style={{ marginTop: 14 }}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setTestFile(e.target.files?.[0])} />
            <button className="button" disabled={!testFile || testing} onClick={runTest}>
              {testing ? 'Đang test...' : 'Chạy test'}
            </button>
          </div>

          {testResult && (
            <div style={{ marginTop: 18 }}>
              <div className="grid">
                {[
                  ['Drain', testResult.result.drain_count],
                  ['Confidence', testResult.result.confidence == null ? '—' : `${(testResult.result.confidence * 100).toFixed(1)}%`],
                  ['Blockage', testResult.result.blockage_percent == null ? '—' : `${testResult.result.blockage_percent}%`],
                  ['Status', testResult.result.status],
                ].map(([k, v]) => <div className="card" key={String(k)}><div className="label">{k}</div><div className="metric">{v}</div></div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 16 }}>
                <div>
                  <div className="label">Ảnh gốc</div>
                  <img src={files(testResult.original_image_url)} alt="Ảnh gốc test" style={{ maxWidth: '100%', borderRadius: 12 }} />
                </div>
                <div>
                  <div className="label">Ảnh AI annotate</div>
                  <img src={files(testResult.annotated_image_url)} alt="Ảnh AI annotate" style={{ maxWidth: '100%', borderRadius: 12 }} />
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
