import './globals.css'; import { QueryProvider } from '@/components/query-provider'; import { Navigation } from '@/components/navigation';
export const metadata={title:'DrainGuard AI',description:'AI-powered Urban Drain Monitoring'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body><QueryProvider><div className="shell"><Navigation/>{children}</div></QueryProvider></body></html>}
