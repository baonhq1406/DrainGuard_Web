'use client';

import Link from 'next/link';
import { Bell, Camera, History, Map as MapIcon } from 'lucide-react';
import { StatusBadge } from '@/components/ui';

export default function Home(){
  const steps=['Gửi ảnh','AI nhận diện','Tính blockage','Lưu vị trí & lịch sử'];
  return <main id="main" className="main">
    <section className="hero">
      <div className="hero-inner">
        <div className="eyebrow">DRAINGUARD AI</div>
        <h1 className="hero-title">Kiểm tra miệng thu nước bằng AI</h1>
        <p className="hero-lead">Gửi ảnh miệng thu nước để phát hiện drain, rác và ước tính mức độ tắc nghẽn. Vị trí GPS có thể được ghi nhận để theo dõi trên bản đồ.</p>
        <div className="hero-actions"><Link href="/analyze" className="button light"><Camera size={18}/>Phân tích ảnh</Link><Link href="/map" className="button outline-light"><MapIcon size={18}/>Xem bản đồ</Link></div>
      </div>
    </section>
    <div className="grid home-grid">
      <Link href="/analyze" className="card card-link"><div className="card-icon"><Camera size={20}/></div><div className="label">01</div><h2>Phân tích</h2><p className="label">Chụp hoặc tải ảnh và nhận kết quả AI ngay.</p></Link>
      <Link href="/map" className="card card-link"><div className="card-icon"><MapIcon size={20}/></div><div className="label">02</div><h2>Bản đồ</h2><p className="label">Theo dõi các vị trí đã kiểm tra kèm GPS.</p></Link>
      <Link href="/history" className="card card-link"><div className="card-icon"><History size={20}/></div><div className="label">03</div><h2>Lịch sử</h2><p className="label">Xem lại kết quả và ảnh AI đã lưu.</p></Link>
      <div className="card"><div className="card-icon"><Bell size={20}/></div><div className="label">04</div><h2>Cảnh báo</h2><p className="label">Blockage được phân loại theo mức độ để dễ theo dõi.</p>
        <div className="chip-row">{['LOW','MODERATE','HIGH','CRITICAL'].map(s=><StatusBadge key={s} status={s}/>)}</div></div>
    </div>
    <section className="panel"><h2>Quy trình</h2><div className="steps-grid">{steps.map((x,i)=><div className="card step-card" key={x}><span className="step-num">{i+1}</span><div><div className="label">Bước {i+1}</div><b>{x}</b></div></div>)}</div></section>
  </main>;
}
