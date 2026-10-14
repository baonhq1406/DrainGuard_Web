'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { EmptyState, StatusBadge } from '@/components/ui';
import type { RecordItem } from '@/types';

type Stats={total_analyses:number;total_drains:number;statuses:Record<string,number>;active_model?:{name:string;version:string;classes:string[]}|null};

export default function AdminDashboard(){
  const {data,error,isFetching,refetch}=useQuery({queryKey:['admin-stats'],queryFn:()=>api<Stats>('/dashboard/stats')});
  const {data:recent=[]}=useQuery({queryKey:['admin-recent'],queryFn:()=>api<RecordItem[]>('/dashboard/recent')});
  const s=data?.statuses||{};
  const alerts=(s.HIGH||0)+(s.CRITICAL||0);
  return <main id="main" className="main">
    <div className="page-head">
      <div><h1 className="title">Admin Dashboard</h1><p className="lead">Quản trị và theo dõi vận hành DrainGuard AI.</p></div>
      <button className="button outline" onClick={()=>refetch()} disabled={isFetching} style={{marginBottom:24}}><RefreshCw size={16} className={isFetching?'spin':''}/>{isFetching?'Đang tải...':'Làm mới'}</button>
    </div>
    {error&&<div className="notice error" role="alert">{error.message}</div>}
    <div className="grid">
      {[['Tổng lượt phân tích',data?.total_analyses],['Drain phát hiện',data?.total_drains],['HIGH / CRITICAL',alerts],['Model active',data?.active_model?.version||'Chưa có']].map(([n,v])=><div className="card" key={String(n)}><div className="label">{n}</div><div className={'metric'+(n==='HIGH / CRITICAL'&&alerts>0?' danger':'')}>{v??'—'}</div></div>)}
    </div>
    <section className="panel"><h2>Phân bố mức độ tắc nghẽn</h2>{Object.keys(s).length?<div className="grid" style={{marginTop:12}}>{Object.entries(s).map(([name,count])=><div className="card" key={name}><div className="label"><StatusBadge status={name}/></div><div className="metric">{count}</div></div>)}</div>:<EmptyState title="Chưa có dữ liệu thống kê"/>}</section>
    <section className="panel"><h2>Phân tích gần đây</h2>{recent.length?<div className="table-wrap" style={{marginTop:8}}><table className="rtable"><thead><tr><th>Thời gian</th><th>Model</th><th>Drain</th><th>Blockage</th><th>Trạng thái</th></tr></thead><tbody>{recent.map(x=><tr key={x.id}><td data-label="Thời gian">{new Date(x.created_at).toLocaleString('vi-VN')}</td><td data-label="Model">{x.model.version}</td><td data-label="Drain">{x.drain_count}</td><td data-label="Blockage">{x.blockage_percent==null?'—':x.blockage_percent+'%'}</td><td data-label="Trạng thái"><StatusBadge status={x.status}/></td></tr>)}</tbody></table></div>:<EmptyState title="Chưa có dữ liệu"/>}</section>
  </main>;
}
