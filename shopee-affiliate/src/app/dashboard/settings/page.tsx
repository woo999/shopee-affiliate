'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Save, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    supabase.auth.getUser().then(({data:{user}})=>{
      if(user){ setEmail(user.email||''); }
    });
    supabase.from('profiles').select('*').single().then(({data})=>{
      if(data) setName(data.full_name||'');
    });
  },[]);

  const save = async()=>{
    setSaving(true);
    const {data:{user}} = await supabase.auth.getUser();
    if(!user){setSaving(false);return;}
    await supabase.from('profiles').update({full_name:name}).eq('id',user.id);
    toast.success('บันทึกแล้ว!');
    setSaving(false);
  };

  return (
    <div className="max-w-lg space-y-5 animate-fade-in">
      <div><h1 className="text-2xl font-display font-bold text-gray-900">ตั้งค่า</h1>
        <p className="text-gray-500 text-sm">จัดการโปรไฟล์และการตั้งค่า</p></div>
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-shopee-600"/>โปรไฟล์</h2>
        <div><label className="label">ชื่อ</label><input className="input" value={name} onChange={e=>setName(e.target.value)}/></div>
       <input className="input bg-gray-50 text-gray-500 cursor-not-allowed" value={email} disabled/>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}บันทึก
        </button>
      </div>
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">🔗 Shopee Affiliate</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• ไปที่ <a href="https://affiliate.shopee.co.th" target="_blank" rel="noopener noreferrer" className="text-shopee-600 hover:underline">affiliate.shopee.co.th</a> เพื่อจัดการ Affiliate Links</p>
          <p>• คัดลอก Affiliate Link แล้วเพิ่มในคลังสินค้า</p>
          <p>• ระบบจะแทรก Link อัตโนมัติในเนื้อหา</p>
        </div>
      </div>
    </div>
  );
}
