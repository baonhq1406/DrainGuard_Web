'use client';

import Link from 'next/link';

export default function Home(){
  const steps=['Gửi ảnh','AI nhận diện','Tính blockage','Lưu vị trí & lịch sử'];
  return <main className="main">
    <section className="panel" style={{padding:'34px 28px'}}>
      <div style={{maxWidth:760}}>
        <div className="label" style={{textTransform:'uppercase',letterSpacing:1,fontWeight:700}}>DrainGuard AI</div>
        <h1 className="title" style={{fontSize:40,marginTop:8}}>Kiểm tra miệng thu nước bằng AI</h1>
        <p className="lead" style={{fontSize:17,lineHeight:1.6,marginTop:12}}>
          Gửi ảnh miệng thu nước để phát hiện drain, rác và ước tính mức độ tắc nghẽn.
          Vị trí GPS có thể được ghi nhận để theo dõi trên bản đồ.
        </p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginTop:20}}>
          <Link href="/analyze" className="button" style={{textDecoration:'none'}}>Phân tích ảnh</Link>
          <Link href="/map" className="button outline" style={{textDecoration:'none'}}>Xem bản đồ</Link>
        </div>
      </div>
    </section>
    <div className="grid">
      <Link href="/analyze" className="card" style={{textDecoration:'none',color:'inherit'}}><div className="label">01</div><h2 style={{margin:'8px 0'}}>Phân tích</h2><p className="label">Chụp hoặc tải ảnh và nhận kết quả AI ngay.</p></Link>
      <Link href="/map" className="card" style={{textDecoration:'none',color:'inherit'}}><div className="label">02</div><h2 style={{margin:'8px 0'}}>Bản đồ</h2><p className="label">Theo dõi các vị trí đã kiểm tra kèm GPS.</p></Link>
      <Link href="/history" className="card" style={{textDecoration:'none',color:'inherit'}}><div className="label">03</div><h2 style={{margin:'8px 0'}}>Lịch sử</h2><p className="label">Xem lại kết quả và ảnh AI đã lưu.</p></Link>
      <div className="card"><div className="label">04</div><h2 style={{margin:'8px 0'}}>Cảnh báo</h2><p className="label">Blockage được phân loại theo mức độ để dễ theo dõi.</p></div>
    </div>
    <section className="panel"><h2>Quy trình</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:14}}>{steps.map((x,i)=><div className="card" key={x}><div className="label">Bước {i+1}</div><b>{x}</b></div>)}</div></section>
  </main>;
}