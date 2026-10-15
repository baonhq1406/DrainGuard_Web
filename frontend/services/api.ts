const envBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

function getCandidateBases(): string[] {
  const candidates = [envBase, 'http://127.0.0.1:8000/api', 'http://localhost:8000/api'];
  if (typeof window !== 'undefined') {
    const hostBase = `${window.location.protocol}//${window.location.hostname}:8000/api`;
    candidates.unshift(hostBase);
    candidates.push('/api');
  }
  return Array.from(new Set(candidates));
}

export const files = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000${path}`;
  }
  return `${envBase.replace('/api', '')}${path}`;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response | undefined;
  let lastErr: unknown;

  for (const candidate of getCandidateBases()) {
    try {
      r = await fetch(candidate + path, init);
      break;
    } catch (err) {
      lastErr = err;
    }
  }

  if (!r) {
    const errMsg = lastErr instanceof Error ? lastErr.message : '';
    if (errMsg.includes('ERR_UPLOAD_FILE_CHANGED')) {
      throw new Error('Tệp vừa thay đổi trên ổ đĩa. Vui lòng chọn lại tệp .pt và tải lên.');
    }
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang hoạt động.');
  }

  if (!r.ok) {
    let detail = '';
    try {
      const data = await r.json();
      if (typeof data?.detail === 'string') {
        detail = data.detail;
      } else if (Array.isArray(data?.detail)) {
        detail = data.detail.map((x: any) => x.msg || JSON.stringify(x)).join(', ');
      }
    } catch {
      try {
        const text = await r.text();
        if (text && text.length < 200 && !text.includes('<!DOCTYPE')) {
          detail = text;
        }
      } catch {
        // ignore text read error
      }
    }

    if (detail) {
      throw new Error(detail);
    }
    if (r.status === 413) {
      throw new Error('Kích thước tệp vượt quá giới hạn cho phép của máy chủ.');
    }
    if (r.status === 500) {
      throw new Error('Máy chủ gặp lỗi nội bộ (500). Vui lòng thử lại sau.');
    }
    if (r.status === 503) {
      throw new Error('Dịch vụ tạm thời chưa sẵn sàng (503).');
    }
    throw new Error(`Yêu cầu thất bại với mã lỗi ${r.status}.`);
  }

  try {
    return await r.json();
  } catch {
    throw new Error('Phản hồi từ máy chủ không đúng định dạng dữ liệu (JSON).');
  }
}

