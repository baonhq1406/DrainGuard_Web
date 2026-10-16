'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  Boxes,
  Camera,
  Database,
  Droplets,
  History,
  Home,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  ScanSearch,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = [href: string, label: string, Icon: LucideIcon, badge?: string];

const userLinks: NavItem[] = [
  ['/', 'Trang chủ', Home],
  ['/analyze', 'Kiểm tra miệng thu', ScanSearch],
  ['/map', 'Bản đồ giám sát', MapIcon],
  ['/history', 'Lịch sử phản ánh', History],
];

const adminLinks: NavItem[] = [
  ['/admin', 'Tổng quan', LayoutDashboard],
  ['/admin/analyze', 'Kiểm tra miệng thu', ScanSearch],
  ['/admin/models', 'AI Models', Boxes],
  ['/admin/datasets', 'Datasets', Database],
  ['/admin/system', 'Hệ thống', Server],
];

export function Navigation() {
  const path = usePathname() ?? '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const links = isAdmin ? adminLinks : userLinks;

  const exact = (href: string) => href === '/' || href === '/admin';
  const active = (href: string) => path === href || (!exact(href) && path.startsWith(href + '/'));

  function closeMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <header className={'site-header' + (isAdmin ? ' is-admin' : '')}>
      <div className="header-container">
        {/* Left: Brand logo */}
        <div className="header-brand-wrap">
          <Link href={isAdmin ? '/admin' : '/'} className="brand" onClick={closeMenu}>
            <span className="brand-mark">
              <Droplets size={20} />
            </span>
            <div className="brand-info">
              <span className="brand-name">DrainGuard AI</span>
              <span className="brand-tag">
                {isAdmin ? 'ADMIN CONSOLE' : 'Giám sát thoát nước'}
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop: Navigation links in center */}
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {links.map(([href, label, Icon]) => {
            const isAct = active(href);
            return (
              <Link
                key={href}
                href={href}
                className={'desktop-nav-link' + (isAct ? ' active' : '')}
                aria-current={isAct ? 'page' : undefined}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="header-actions">
          {isAdmin ? (
            <Link href="/" className="button outline-light sm user-switch-btn">
              <ArrowLeft size={16} />
              <span>Về trang người dùng</span>
            </Link>
          ) : (
            <>
              <Link href="/analyze" className="button sm header-cta-btn">
                <Camera size={16} />
                <span>Kiểm tra ngay</span>
              </Link>
              <Link
                href="/admin"
                className="admin-badge-btn"
                title="Dành cho cán bộ quản lý hệ thống"
              >
                <ShieldCheck size={16} />
                <span className="admin-btn-label">Quản trị</span>
              </Link>
            </>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" role="dialog" aria-modal="true">
          <div className="mobile-drawer-content">
            <div className="mobile-drawer-header">
              <span className="brand-tag">MENU ĐIỀU HƯỚNG</span>
              <button
                type="button"
                className="button outline sm"
                onClick={closeMenu}
                aria-label="Đóng menu"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="mobile-drawer-nav">
              {links.map(([href, label, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  className={'mobile-nav-link' + (active(href) ? ' active' : '')}
                  onClick={closeMenu}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="mobile-drawer-footer">
              {isAdmin ? (
                <Link href="/" className="button outline sm full-w" onClick={closeMenu}>
                  <ArrowLeft size={16} />
                  Quay lại trang người dùng
                </Link>
              ) : (
                <>
                  <Link href="/analyze" className="button sm full-w" onClick={closeMenu}>
                    <Camera size={16} />
                    Chụp ảnh kiểm tra ngay
                  </Link>
                  <Link href="/admin" className="button outline sm full-w mt-2" onClick={closeMenu}>
                    <ShieldCheck size={16} />
                    Khu vực Quản trị viên
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="bottom-bar" aria-label="Điều hướng nhanh di động">
        {links.map(([href, label, Icon]) => (
          <Link
            key={href}
            href={href}
            className={'bottom-tab' + (active(href) ? ' active' : '')}
            aria-current={active(href) ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
}
