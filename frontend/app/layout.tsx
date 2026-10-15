import './globals.css';
import type { Viewport, Metadata } from 'next';
import { QueryProvider } from '@/components/query-provider';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'DrainGuard AI — Giám sát miệng thu nước & Cảnh báo ngập úng đô thị',
  description: 'Nền tảng trí tuệ nhân tạo nhận diện miệng thu nước, đánh giá độ tắc nghẽn và hỗ trợ phòng chống ngập úng đô thị.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#071a2f',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <QueryProvider>
          <a href="#main" className="skip-link">
            Bỏ qua điều hướng
          </a>
          <div className="app-shell">
            <Navigation />
            <div className="app-main-content">
              {children}
            </div>
            <Footer />
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
