'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Edit, Trash2, Clock, CheckCircle, Copy } from 'lucide-react';
import type { Content } from '@/types';
import { cn, STATUS_COLOR, STATUS_LABEL, PLATFORM_ICON, CATEGORY_ICON, formatDate, truncate } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUSES = ['all','draft','pending','scheduled','published','archived'];
const CATS = ['all','baby','pet','beauty','other'];

export default function ContentPage() {
  const [items, setItems] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (status!=='all') p.set('status',status);
    if (cat!=='all') p.set('category',cat);
    if (search) p.set('search',search);
    const r = await fetch(`/api/content?${p}`);
    const d = await r.json();
    setItems(d.data||[]);
    setLoading(false);
  },[status,cat,search]);

  useEffect(()=>{const t=setTimeout(fetch_,300);return()=>clearTimeout(t);},[fetch_]);

  const del = async (id:string) => {
    if(!confirm('ลบเนื้อหานี้?'))return;
    await fetch(`/api/content/${id}`,{method:'DELETE'});
    toast.success('ลบแล้ว');
    fetch_();
  };
  const markPending = async (id:string) => {
    await fetch(`/api/content/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'pending'})});
    toast.success('ทำเครื่องหมายรอดำเนินการแล้ว');
    fetch_();
  };
  const markPublished = async (id:string) => {
    await fetch(`/api/content/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'published',published_at:new Date().toISOString()})});
    toast.success('ทำเครื่องหมายเผยแพร่แล้ว');
    fetch_();
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold text-gray-900">คลังเนื้อหา</h1>
          <p className="text-gray-500 text-sm">จัดการเนื้อหา Affiliate ทั้งหมด</p></div>
        <Link href="/dashboard/content/new" className="btn-primary"><Plus className="w-4 h-4"/>สร้างใหม่</Link>
      </div>

      <div className="card space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input className="input pl-9" placeholder="ค้นหาเนื้อหา..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s=>(
            <button key={s} onClick={()=>setStatus(s)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                status===s ? 'bg-shopee-600 text-white border-shopee-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {s==='all'?'ทั้งหมด':STATUS_LABEL[s]}
            </button>
          ))}
          <span className="text-gray-200">|</span>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                cat===c ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {c==='all'?'ทุกหมวด':`${CATEGORY_ICON[c]} ${c}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? [...Array(5)].map((_,i)=><div key={i} className="card skeleton h-24"/>) :
       items.length===0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="font-medium text-gray-500">ไม่มีเนื้อหา</p>
          <Link href="/dashboard/content/new" className="btn-primary inline-flex mt-3"><Plus className="w-4 h-4"/>สร้างเลย</Link>
        </div>
       ) : (
        <div className="space-y-2">
          {items.map(item=>{
            const sel = item.content_versions?.find(v=>v.is_selected);
            const preview = sel?.text||item.translated_text||item.source_text||'';
            return (
              <div key={item.id} className="card hover:shadow-md transition-shadow group">
                <div className="flex gap-3">
                  <div className="text-2xl flex-shrink-0">{PLATFORM_ICON[item.platform]||'📱'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <Link href={`/dashboard/content/${item.id}`} className="font-semibold text-gray-900 hover:text-shopee-600 transition-colors flex-1 min-w-0 truncate">
                        {item.title||<span className="text-gray-400 italic">ไม่มีชื่อ</span>}
                      </Link>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <span className={cn('badge',STATUS_COLOR[item.status])}>{STATUS_LABEL[item.status]}</span>
                        {item.category && <span className="badge bg-gray-100 text-gray-600">{CATEGORY_ICON[item.category]}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                      <span>{formatDate(item.created_at)}</span>
                      {item.scheduled_at&&<span className="text-blue-500">📅 {formatDate(item.scheduled_at,'dd/MM HH:mm')}</span>}
                      {item.content_products&&item.content_products.length>0&&<span className="text-green-600">🛍️ {item.content_products.length} สินค้า</span>}
                      {item.content_versions&&<span><Copy className="w-3 h-3 inline mr-0.5"/>{item.content_versions.length} เวอร์ชัน</span>}
                    </div>
                    {preview && <p className="text-sm text-gray-500 mt-1.5 line-clamp-1 bg-gray-50 rounded-lg px-2 py-1">{truncate(preview,120)}</p>}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/content/${item.id}`} className="btn-secondary py-1 px-2 text-xs"><Edit className="w-3 h-3"/>แก้ไข</Link>
                    {item.status==='draft'&&<button onClick={()=>markPending(item.id)} className="btn-secondary py-1 px-2 text-xs text-yellow-600 border-yellow-200"><Clock className="w-3 h-3"/>รอดำ</button>}
                    {(item.status==='pending'||item.status==='scheduled')&&<button onClick={()=>markPublished(item.id)} className="btn-secondary py-1 px-2 text-xs text-green-600 border-green-200"><CheckCircle className="w-3 h-3"/>โพสต์แล้ว</button>}
                    <button onClick={()=>del(item.id)} className="btn-secondary py-1 px-2 text-xs text-red-500 border-red-200"><Trash2 className="w-3 h-3"/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
       )}
    </div>
  );
}
