const base=process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api'; export const files=(path:string)=>`${base.replace('/api','')}${path}`;
export async function api<T>(path:string,init?:RequestInit):Promise<T>{const r=await fetch(base+path,init);if(!r.ok){const data=await r.json().catch(()=>null);throw new Error(data?.detail||'Không thể kết nối máy chủ.')}return r.json()}
