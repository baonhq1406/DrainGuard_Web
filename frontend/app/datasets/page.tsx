'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { EmptyState, TableSkeleton, noticeClass } from '@/components/ui';

type Dataset = {
  id: number; name: string; version: string; task: string; classes_json: string[];
  image_count: number; train_count: number; val_count: number; test_count: number;
  source?: string | null; description?: string | null;
};

const emptyForm = {
  name: '', version: '', task: 'segment', classes: 'drain, debris',
  image_count: '0', train_count: '0', val_count: '0', test_count: '0',
  source: '', description: '',
};

export default function Datasets() {
  const qc = useQueryClient();
  const { data = [], error, isLoading } = useQuery({ queryKey: ['datasets'], queryFn: () => api<Dataset[]>('/datasets') });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Dataset>();
  const [message, setMessage] = useState('');

  function set(key: keyof typeof emptyForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function fromDataset(x: Dataset) {
    setEditing(x);
    setForm({
      name: x.name, version: x.version, task: x.task,
      classes: x.classes_json.join(', '),
      image_count: String(x.image_count), train_count: String(x.train_count),
      val_count: String(x.val_count), test_count: String(x.test_count),
      source: x.source || '', description: x.description || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function payload() {
    return {
      name: form.name.trim(),
      version: form.version.trim(),
      task: form.task,
      classes_json: form.classes.split(',').map(x => x.trim()).filter(Boolean),
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
      setMessage(editing ? 'Đã cập nhật dataset.' : 'Đã thêm dataset.');
      setEditing(undefined);
      setForm(emptyForm);
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
      if (editing?.id === id) { setEditing(undefined); setForm(emptyForm); }
      qc.invalidateQueries({ queryKey: ['datasets'] });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Không thể xóa dataset');
    }
  }

  return (
    <main id="main" className="main">
      <h1 className="title">Datasets</h1>
      <p className="lead">Quản lý version dataset và nguồn training để truy xuất nguồn gốc model.</p>

      <section className="panel">
        <div className="panel-head"><h2>{editing ? 'Chỉnh sửa dataset' : 'Thêm dataset'}</h2>{editing && <span className="status MODERATE">Đang sửa: {editing.name}</span>}</div>
        <div className="form-grid">
          <div className="field"><label htmlFor="ds-name">Tên dataset *</label><input id="ds-name" placeholder="Tên dataset" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-version">Version *</label><input id="ds-version" placeholder="Version" value={form.version} onChange={e => set('version', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-task">Loại tác vụ</label>
            <select id="ds-task" value={form.task} onChange={e => set('task', e.target.value)}>
              <option value="segment">segment</option><option value="detect">detect</option>
            </select>
          </div>
          <div className="field"><label htmlFor="ds-classes">Classes (cách nhau bằng dấu phẩy)</label><input id="ds-classes" placeholder="Classes: drain, debris" value={form.classes} onChange={e => set('classes', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-total">Tổng ảnh</label><input id="ds-total" type="number" min="0" placeholder="Tổng ảnh" value={form.image_count} onChange={e => set('image_count', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-train">Train</label><input id="ds-train" type="number" min="0" placeholder="Train" value={form.train_count} onChange={e => set('train_count', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-val">Validation</label><input id="ds-val" type="number" min="0" placeholder="Validation" value={form.val_count} onChange={e => set('val_count', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-test">Test</label><input id="ds-test" type="number" min="0" placeholder="Test" value={form.test_count} onChange={e => set('test_count', e.target.value)} /></div>
          <div className="field"><label htmlFor="ds-source">Nguồn / URL</label><input id="ds-source" placeholder="Nguồn / URL" value={form.source} onChange={e => set('source', e.target.value)} /></div>
          <div className="field full"><label htmlFor="ds-desc">Mô tả</label><textarea id="ds-desc" placeholder="Mô tả dataset" value={form.description} onChange={e => set('description', e.target.value)} rows={3} /></div>
        </div>
        <div className="form-actions">
          <button className="button" onClick={save}>{editing ? 'Lưu thay đổi' : 'Thêm dataset'}</button>
          {editing && <button className="button outline" onClick={() => { setEditing(undefined); setForm(emptyForm); setMessage(''); }}>Hủy</button>}
        </div>
        {message && <div className={noticeClass(message)} role="status">{message}</div>}
      </section>

      {error && <div className="notice error" role="alert">{error.message}</div>}

      <section className="panel">
        <div className="panel-head"><h2>Danh sách dataset</h2><span className="label">{isLoading ? 'Đang tải…' : data.length + ' dataset'}</span></div>
        {isLoading ? <TableSkeleton /> : data.length ? (
          <div className="table-wrap">
            <table className="rtable">
              <thead><tr><th>Tên</th><th>Version</th><th>Task</th><th>Classes</th><th>Ảnh</th><th>Train</th><th>Val</th><th>Test</th><th>Nguồn</th><th></th></tr></thead>
              <tbody>
                {data.map(x => (
                  <tr key={x.id} className={editing?.id === x.id ? 'is-selected' : ''}>
                    <td data-label="Tên"><b>{x.name}</b><div className="cell-sub">{x.description || ''}</div></td>
                    <td data-label="Version">{x.version}</td><td data-label="Task">{x.task}</td><td data-label="Classes">{x.classes_json.join(', ') || '—'}</td>
                    <td data-label="Ảnh">{x.image_count}</td><td data-label="Train">{x.train_count}</td><td data-label="Val">{x.val_count}</td><td data-label="Test">{x.test_count}</td>
                    <td data-label="Nguồn" style={{ overflowWrap: 'anywhere' }}>{x.source || '—'}</td>
                    <td data-label=""><div className="cell-actions"><button className="button outline sm" onClick={() => fromDataset(x)}><Pencil size={14} />Sửa</button><button className="button outline danger sm" onClick={() => remove(x.id)}><Trash2 size={14} />Xóa</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="Chưa có dataset nào">Dùng form phía trên để thêm dataset đầu tiên.</EmptyState>}
      </section>
    </main>
  );
}
