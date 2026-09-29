'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const userLinks=[['/','Trang chủ'],['/analyze','Phân tích'],['/map','Bản đồ'],['/history','Lịch sử']];
const adminLinks=[['/admin','Dashboard'],['/admin/models','AI Models'],['/admin/datasets','Datasets'],['/admin/system','Hệ thống']];

export function Navigation(){
  const path=usePathname();
  const isAdmin=path==='/admin'||path.startsWith('/admin/');
  const links=isAdmin?adminLinks:userLinks;
  return <>
    <aside className="side">
      <div className="brand">DrainGuard AI</div>
      <div className="subtitle">{isAdmin?'ADMIN CONSOLE':'AI-powered Urban Drain Monitoring'}</div>
      {links.map(([href,label])=><Link key={href} href={href} className={'nav '+(path===href?'active':'')}>{label}</Link>)}
      {isAdmin&&<Link href="/" className="nav" style={{marginTop:24,borderTop:'1px solid #23435b',paddingTop:18}}>← Trang người dùng</Link>}
    </aside>
    <nav className="bottom">
      {links.map(([href,label])=><Link key={href} href={href} className={path===href?'active':''}>{label}</Link>)}
    </nav>
  </>;
}