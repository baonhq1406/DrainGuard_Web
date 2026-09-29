'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { RecordItem } from '@/types';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

type Stats={total_analyses:number;total_drains:number;statuses:Record<string,number>;active_model?:{name:string;version:string;classes:string[]}|null};
type Timeline={date:string;count:number};

export default function Dashboard(){
  const {data,error}=useQuery({queryKey:['stats'],queryFn:()=>api<Stats>('/dashboard/stats')});
  const {data:recent=[]}=useQuery({queryKey:['recent'],queryFn:()=>api<RecordItem[]>('/dashboard/recent')});
  const {data:timeline=[]}=useQuery({queryKey:['timeline'],queryFn:()=>api<Timeline[]>('/dashboard/timeline')});
  const s=data?.statuses||{};
  const statusRows=[['LOW',s.LOW||0],['MODERATE',s.MODERATE||0],['HIGH',s.HIGH||0],['CRITICAL',s.CRITICAL||0],['MODEL_LIMITED',s.MODEL_LIMITED||0],['NO_DRAIN',s.NO_DRAIN||0]] as const;

  return <main className="main">
    <h1 className="title">Dashboard</h1>
    <p className="lead">Tổng quan giám sát miệng thu nước đô thị.</p>
    {error&&<div className="notice">{error.message}</div>}
    {data?.active_model&&!data.active_model.classes.map(x=>x.toLowerCase()).includes('debris')&&<div className="notice">Model hiện tại chỉ hỗ trợ nhận diện drain. Blockage analysis chưa khả dụng.</div>}
    <div className="grid">
      {[['Tổng lượt phân tích',data?.total_analyses],['Drain phát hiện',data?.total_drains],['Mức cao / nguy cấp',(s.HIGH||0)+(s.CRITICAL||0)],['Model active',data?.active_model?.version||'Chưa có']].map(([n,v])=><div className="card" key={String(n)}><div className="label">{n}</div><div className="metric">{v??'—'}</div></div>)}
    </div>

    <section className="panel">
      <h2>Phân tích 14 ngày gần đây</h2>
      <div style={{width:'100%',height:280}}>
        <ResponsiveContainer>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#0879c9" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>

    <section className="panel">
      <h2>Phân bố trạng thái</h2>
      <div style={{display:'grid',gap:10}}>
        {statusRows.map(([name,count])=><div key={name} style={{display:'grid',gridTemplateColumns:'130px 1fr 50px',gap:10,alignItems:'center'}}>
          <span>{name}</span>
          <div style={{height:10,background:'#e8eff5',borderRadius:99,overflow:'hidden'}}><div style={{height:'100%',width:`${data?.total_analyses?Math.min(100,(count/data.total_analyses)*100):0}%`,background:'#0879c9'}} /></div>
          <b>{count}</b>
        </div>)}
      </div>
    </section>

    <section className="panel">
      <h2>Phân tích gần đây</h2>
      {recent.length?<table><thead><tr><th>Thời gian</th><th>Model</th><th>Drain</th><th>Blockage</th><th>Trạng thái</th></tr></thead><tbody>{recent.map(x=><tr key={x.id}><td>{new Date(x.created_at).toLocaleString('vi-VN')}</td><td>{x.model.version}</td><td>{x.drain_count}</td><td>{x.blockage_percent==null?'Chưa hỗ trợ':`${x.blockage_percent}%`}</td><td><span className={'status '+x.status}>{x.status}</span></td></tr>)}</tbody></table>:<p className="lead">Chưa có phân tích nào. Hãy bắt đầu từ trang Phân tích.</p>}
    </section>
  </main>
}
