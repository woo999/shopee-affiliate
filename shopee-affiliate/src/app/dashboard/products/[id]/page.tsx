'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { CATEGORY_ICON, CATEGORY_LABEL } from '@/lib/utils';

const CATS = ['baby','pet','beauty','other'] as const;

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product|null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'',name_th:'',shopee_url:'',affiliate_url:'',image_url:'',price:'',category:'beauty',commission_rate:'',tags:'' });

  useEffect(()=>{
    fetch(`/api/products?active_only=false`).then(r=>r.json()).then(d=>{
      const p = (d.data||[]).find((x:Product)=>x.id===params.id);
      if(p){ setProduct(p); setForm({...p,price:p.price?String(p.price):'',commission_rate:p.commission_rate?String(p.commission_rate):'',tags:(p.tags||[]).join(',')}); }
    });
  },[params.id]);

  const set = (k:string,v:string) => setForm(prev=>({...prev,[k]:v}));

  const save = async()=>{
    setSaving(true);
    try {
      const r = await fetch(`/api/products/${params.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,price:form.price?parseFloat(form.price):null,commission_rate:form.commission_rate?parseFloat(form.commission_rate):null,tags:form.tags.split(',').map((t:string)=>t.trim()).filter(Boolean)})});
      if(!r.ok) throw new Error();
      toast.success('บันทึกแล้ว!'); router.push('/dashboard/products');
    } catch { toast.error('ไม่สำเร็จ'); } finally { setSaving(false); }
  };

  const del = async()=>{
    if(!confirm('ลบ?'))return;
    await fetch(`/api/products/${params.id}`,{method:'DELETE'});
    toast.success('ลบแล้ว'); router.push('/dashboard/products');
  };

  if(!product) return <div className="card text-center py-8 text-gray-400">กำลังโหลด...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5"/></Link>
        <h1 className="text-xl font-display font-bold text-gray-900 flex-1">แก้ไขสินค้า</h1>
        <button onClick={del} className="btn-secondary text-red-500 border-red-200"><Trash2 className="w-4 h-4"/></button>
      </div>
      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">ชื่อ *</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)}/></div>
          <div><label className="label">ชื่อไทย</label><input className="input" value={form.name_th} onChange={e=>set('name_th',e.target.value)}/></div>
        </div>
        <div><label className="label">Shopee URL *</label><input className="input" value={form.shopee_url} onChange={e=>set('shopee_url',e.target.value)}/></div>
        <div><label className="label">Affiliate Link</label><input className="input" value={form.affiliate_url} onChange={e=>set('affiliate_url',e.target.value)}/></div>
        <div><label className="label">รูป URL</label><input className="input" value={form.image_url} onChange={e=>set('image_url',e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">ราคา</label><input className="input" type="number" value={form.price} onChange={e=>set('price',e.target.value)}/></div>
          <div><label className="label">คอม %</label><input className="input" type="number" step="0.1" value={form.commission_rate} onChange={e=>set('commission_rate',e.target.value)}/></div>
        </div>
        <div><label className="label">หมวด</label>
          <div className="flex gap-2 flex-wrap">
            {CATS.map(c=><button key={c} type="button" onClick={()=>set('category',c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.category===c?'bg-shopee-600 text-white border-shopee-600':'bg-white text-gray-600 border-gray-200'}`}>
              {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}</button>)}
          </div>
        </div>
        <div><label className="label">แท็ก</label><input className="input" value={form.tags} onChange={e=>set('tags',e.target.value)}/></div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}บันทึก
        </button>
      </div>
    </div>
  );
}
