'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Package, Edit, Trash2, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Product } from '@/types';
import { cn, CATEGORY_ICON, CATEGORY_LABEL, formatTHB } from '@/lib/utils';
import toast from 'react-hot-toast';

const CATS = ['all','baby','pet','beauty','other'];

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async()=>{
    setLoading(true);
    const p = new URLSearchParams({active_only:'false'});
    if(cat!=='all') p.set('category',cat);
    if(search) p.set('search',search);
    const r = await fetch(`/api/products?${p}`);
    const d = await r.json();
    setItems(d.data||[]);
    setLoading(false);
  },[cat,search]);

  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[load]);

  const del = async(id:string)=>{
    if(!confirm('ลบสินค้านี้?'))return;
    await fetch(`/api/products/${id}`,{method:'DELETE'});
    toast.success('ลบแล้ว'); load();
  };
  const toggle = async(id:string, active:boolean)=>{
    await fetch(`/api/products/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({is_active:!active})});
    load();
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-display font-bold text-gray-900">คลังสินค้า</h1>
          <p className="text-gray-500 text-sm">สินค้า Shopee Affiliate ของคุณ</p></div>
        <Link href="/dashboard/products/new" className="btn-primary"><Plus className="w-4 h-4"/>เพิ่มสินค้า</Link>
      </div>

      <div className="card space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input pl-9" placeholder="ค้นหาสินค้า..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={cn('px-3 py-1 rounded-lg text-xs font-medium border transition-colors',
                cat===c ? 'bg-shopee-600 text-white border-shopee-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {c==='all'?'ทุกหมวด':`${CATEGORY_ICON[c]} ${CATEGORY_LABEL[c]}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i)=><div key={i} className="skeleton h-48 rounded-2xl"/>)}
        </div>
      ) : items.length===0 ? (
        <div className="card text-center py-16">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="font-medium text-gray-500">ยังไม่มีสินค้า</p>
          <p className="text-sm text-gray-400 mb-4">เพิ่มสินค้าและลิงก์ Affiliate จาก Shopee</p>
          <Link href="/dashboard/products/new" className="btn-primary inline-flex"><Plus className="w-4 h-4"/>เพิ่มสินค้า</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(p=>(
            <div key={p.id} className={cn('card hover:shadow-md transition-all group relative',!p.is_active&&'opacity-60')}>
              <div className="flex items-start gap-3">
                {p.image_url ? <img src={p.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"/>
                  : <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0"><span className="text-2xl">{CATEGORY_ICON[p.category||'other']}</span></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{p.name_th||p.name}</p>
                  <p className="text-xs text-gray-400 truncate">{p.name}</p>
                  <p className="text-shopee-600 font-bold mt-1">{p.price?formatTHB(p.price):'-'}</p>
                  {p.commission_rate&&<p className="text-xs text-green-600">คอม {p.commission_rate}%</p>}
                </div>
              </div>

              {p.tags?.length>0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {p.tags.map(t=><span key={t} className="badge bg-gray-100 text-gray-500">#{t}</span>)}
                </div>
              )}

              {p.affiliate_url && (
                <a href={p.affiliate_url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-xs text-shopee-600 hover:underline">
                  <ExternalLink className="w-3 h-3"/>Affiliate Link
                </a>
              )}

              <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/dashboard/products/${p.id}`} className="btn-secondary py-1 px-2 text-xs flex-1 justify-center"><Edit className="w-3 h-3"/>แก้ไข</Link>
                <button onClick={()=>toggle(p.id,p.is_active)} className="btn-secondary py-1 px-2 text-xs">
                  {p.is_active?<ToggleRight className="w-4 h-4 text-green-600"/>:<ToggleLeft className="w-4 h-4 text-gray-400"/>}
                </button>
                <button onClick={()=>del(p.id)} className="btn-secondary py-1 px-2 text-xs text-red-500 border-red-200"><Trash2 className="w-3 h-3"/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
