const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api';

export const files = (path: string) => `${base.replace('/api', '')}${path}`;

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(base + path, init);
  } catch (err) {
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
      // Body is not JSON (e.g. plain text "Internal Server Error" or gateway HTML)
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

