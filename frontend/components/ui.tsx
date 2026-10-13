import type { ReactNode } from 'react';

/** Nhãn tiếng Việt cho mức độ tắc nghẽn — dùng thống nhất ở Lịch sử, Dashboard, Trang chủ. */
export const statusText: Record<string, string> = {
  LOW: 'Thông thoáng',
  MODERATE: 'Có nguy cơ tắc',
  HIGH: 'Tắc nhiều',
  CRITICAL: 'Tắc nghiêm trọng',
  NO_DRAIN: 'Không thấy miệng thu',
  MODEL_LIMITED: 'Thiếu dữ liệu AI',
};

/** Huy hiệu mức độ. Giữ nguyên class `status <ENUM>` nên màu cũ vẫn hoạt động; enum gốc nằm ở tooltip. */
export function StatusBadge({ status }: { status: string }) {
  return <span className={'status ' + status} title={status}>{statusText[status] || status}</span>;
}

/** Huy hiệu trạng thái model (ACTIVE / READY / INVALID / ARCHIVED). */
export function ModelStatusBadge({ status, active }: { status: string; active?: boolean }) {
  const key = active ? 'ACTIVE' : status;
  return <span className={'status ' + key}>{key}</span>;
}

/** Chọn kiểu thông báo từ nội dung message hiện có (không cần đổi logic set message). */
export function noticeClass(message: string) {
  if (/^Đang /.test(message)) return 'notice';
  if (/^Đã /.test(message)) return 'notice success';
  if (/^Vui lòng/.test(message)) return 'notice warn';
  return 'notice error';
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, i) => <div className="skeleton" key={i} />)}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="empty-state"><b>{title}</b>{children}</div>;
}
