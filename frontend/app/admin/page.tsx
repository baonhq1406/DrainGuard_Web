'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { RecordItem } from '@/types';

type Stats={total_analyses:number;total_drains:number;statuses:Record<string,number>;active_model?:{name:string;version:string;classes:string[]}|null};

export default function AdminDashboard(){
  const {data,error,isFetching,refetch}=useQuery({queryKey:['admin-stats'],queryFn:()=>api<Stats>('/dashboard/stats')});
  const {data:recent=[]}=useQuery({queryKey:['admin-recent'],queryFn:()=>api<RecordItem[]>('/dashboard/recent')});
  const s=data?.statuses||{};
  return <main className="main">
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'end',flexWrap:'wrap'}}>
      <div><h1 className="title">Admin Dashboard</h1><p className="lead">Quản trị và theo dõi vận hành DrainGuard AI.</p></div>
      <button className="button outline" onClick={()=>refetch()} disabled={isFetching}>{isFetching?'Đang tải...':'Làm mới'}</button>
    </div>
    {error&&<div className="notice">{error.message}</div>}
    <div className="grid">
      {[['Tổng lượt phân tích',data?.total_analyses],['Drain phát hiện',data?.total_drains],['HIGH / CRITICAL',(s.HIGH||0)+(s.CRITICAL||0)],['Model active',data?.active_model?.version||'Chưa có']].map(([n,v])=><div className="card" key={String(n)}><div className="label">{n}</div><div className="metric">{v??'—'}</div></div>)}
    </div>
    <section className="panel"><h2>Trạng thái hệ thống</h2><div className="grid" style={{marginTop:12}}>{Object.entries(s).map(([name,count])=><div className="card" key={name}><div className="label">{name}</div><div className="metric">{count}</div></div>)}</div></section>
    <section className="panel"><h2>Phân tích gần đây</h2>{recent.length?<div style={{overflowX:'auto'}}><table><thead><tr><th>Thời gian</th><th>Model</th><th>Drain</th><th>Blockage</th><th>Trạng thái</th></tr></thead><tbody>{recent.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString('vi-VN')}</td><td>{x.model.version}</td><td>{x.drain_count}</td><td>{x.blockage_percent==null?'—':x.blockage_percent+'%'}</td><td><span className={'status '+x.status}>{x.status}</span></td></tr>)}</tbody></table></div>:<p className="lead">Chưa có dữ liệu.</p>}</section>
  </main>;
}