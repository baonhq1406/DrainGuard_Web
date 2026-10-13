import './globals.css'; import type { Viewport } from 'next'; import { QueryProvider } from '@/components/query-provider'; import { Navigation } from '@/components/navigation';
export const metadata={title:'DrainGuard AI',description:'AI-powered Urban Drain Monitoring'};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#071a2f'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body><QueryProvider><a href="#main" className="skip-link">Bỏ qua điều hướng</a><div className="shell"><Navigation/>{children}</div></QueryProvider></body></html>}
