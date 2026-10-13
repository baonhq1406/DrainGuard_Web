'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Boxes, Database, Droplets, History, Home, LayoutDashboard, Map as MapIcon, ScanSearch, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = [href: string, label: string, Icon: LucideIcon];

const userLinks: NavItem[] = [['/', 'Trang chủ', Home], ['/analyze', 'Phân tích', ScanSearch], ['/map', 'Bản đồ', MapIcon], ['/history', 'Lịch sử', History]];
const adminLinks: NavItem[] = [['/admin', 'Dashboard', LayoutDashboard], ['/admin/models', 'AI Models', Boxes], ['/admin/datasets', 'Datasets', Database], ['/admin/system', 'Hệ thống', Server]];

export function Navigation() {
  const path = usePathname() ?? '';
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const links = isAdmin ? adminLinks : userLinks;
  // '/' và '/admin' chỉ active khi khớp chính xác (nếu không sẽ luôn sáng); các mục khác active cả ở trang con.
  const exact = (href: string) => href === '/' || href === '/admin';
  const active = (href: string) => path === href || (!exact(href) && path.startsWith(href + '/'));

  return <>
    <aside className="side" aria-label="Điều hướng chính">
      <div className="brand"><span className="brand-mark"><Droplets size={19} /></span>DrainGuard AI</div>
      <div className="subtitle">{isAdmin ? 'ADMIN CONSOLE' : 'AI-powered Urban Drain Monitoring'}</div>
      <nav>
        {links.map(([href, label, Icon]) => (
          <Link key={href} href={href} className={'nav ' + (active(href) ? 'active' : '')} aria-current={active(href) ? 'page' : undefined}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      {isAdmin && <div className="nav-footer"><Link href="/" className="nav"><ArrowLeft size={18} />Trang người dùng</Link></div>}
    </aside>
    <nav className="bottom" aria-label="Điều hướng di động">
      {links.map(([href, label, Icon]) => (
        <Link key={href} href={href} className={active(href) ? 'active' : ''} aria-current={active(href) ? 'page' : undefined}>
          <Icon size={20} />{label}
        </Link>
      ))}
      {isAdmin && <Link href="/"><ArrowLeft size={20} />Người dùng</Link>}
    </nav>
  </>;
}
