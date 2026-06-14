'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CATEGORY_ICON, CATEGORY_LABEL } from '@/lib/utils';

const CATS = ['baby','pet','beauty','other'] as const;

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:'', name_th:'', shopee_url:'', affiliate_url:'',
    image_url:'', price:'', category:'beauty', commission_rate:'',
    tags:''
  });

  const set = (k:string, v:string) => setForm(prev=>({...prev,[k]:v}));

  const handleSave = async () => {
    if(!form.name||!form.shopee_url) return toast.error('กรอกชื่อและ Shopee URL');
    setSaving(true);
    try {
      const r = await fetch('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          ...form,
          price: form.price?parseFloat(form.price):null,
          commission_rate: form.commission_rate?parseFloat(form.commission_rate):null,
          tags: form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : [],
        })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error);
      toast.success('เพิ่มสินค้าแล้ว!');
      router.push('/dashboard/products');
    } catch(e){ toast.error(e instanceof Error?e.message:'ไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5"/></Link>
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">เพิ่มสินค้าใหม่</h1>
          <p className="text-gray-500 text-xs">เพิ่มสินค้าและ Affiliate Link จาก Shopee</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">📋 วิธีได้ Affiliate Link</p>
        <ol className="text-xs text-amber-700 space-y-0.5 list-decimal list-inside">
          <li>ไปที่ <a href="https://affiliate.shopee.co.th" target="_blank" rel="noopener noreferrer" className="underline font-medium">affiliate.shopee.co.th <ExternalLink className="w-3 h-3 inline"/></a></li>
          <li>ค้นหาสินค้าที่ต้องการ</li>
          <li>คลิก "Get Link" คัดลอก Affiliate URL</li>
          <li>วางลิงก์ด้านล่างนี้</li>
        </ol>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ชื่อสินค้า (ภาษาอังกฤษ) *</label>
            <input className="input" placeholder="Vitamin C Serum" value={form.name} onChange={e=>set('name',e.target.value)}/>
          </div>
          <div>
            <label className="label">ชื่อภาษาไทย</label>
            <input className="input" placeholder="เซรั่มวิตามินซี" value={form.name_th} onChange={e=>set('name_th',e.target.value)}/>
          </div>
        </div>

        <div>
          <label className="label">Shopee URL *</label>
          <input className="input" type="url" placeholder="https://shopee.co.th/product/..." value={form.shopee_url} onChange={e=>set('shopee_url',e.target.value)}/>
        </div>

        <div>
          <label className="label">Affiliate Link (จาก affiliate.shopee.co.th)</label>
          <input className="input" type="url" placeholder="https://s.shopee.co.th/..." value={form.affiliate_url} onChange={e=>set('affiliate_url',e.target.value)}/>
          <p className="text-xs text-gray-400 mt-1">ลิงก์นี้จะถูกแทรกในเนื้อหาอัตโนมัติ</p>
        </div>

        <div>
          <label className="label">URL รูปสินค้า</label>
          <input className="input" type="url" placeholder="https://..." value={form.image_url} onChange={e=>set('image_url',e.target.value)}/>
          {form.image_url && <img src={form.image_url} alt="" className="mt-2 w-24 h-24 rounded-xl object-cover border"/>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">ราคา (บาท)</label>
            <input className="input" type="number" placeholder="299" value={form.price} onChange={e=>set('price',e.target.value)}/>
          </div>
          <div>
            <label className="label">อัตราคอมมิชชัน (%)</label>
            <input className="input" type="number" step="0.1" placeholder="8.5" value={form.commission_rate} onChange={e=>set('commission_rate',e.target.value)}/>
          </div>
        </div>

        <div>
          <label className="label">หมวดหมู่</label>
          <div className="flex gap-2 flex-wrap">
            {CATS.map(c=>(
              <button key={c} type="button" onClick={()=>set('category',c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.category===c?'bg-shopee-600 text-white border-shopee-600':'bg-white text-gray-600 border-gray-200'}`}>
                {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">แท็ก <span className="text-gray-400 font-normal">(คั่นด้วยจุลภาค)</span></label>
          <input className="input" placeholder="skincare, serum, vitamin-c" value={form.tags} onChange={e=>set('tags',e.target.value)}/>
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dashboard/products" className="btn-ghost">ยกเลิก</Link>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
            บันทึกสินค้า
          </button>
        </div>
      </div>
    </div>
  );
}
