'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Edit2, Save, Trash2, Calendar, ExternalLink, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Content } from '@/types';
import { cn, STATUS_COLOR, STATUS_LABEL, PLATFORM_ICON, formatDate } from '@/lib/utils';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<Content|null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string|null>(null);
  const [editText, setEditText] = useState('');
  const [copied, setCopied] = useState<string|null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showSched, setShowSched] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const load = async () => {
    const r = await fetch(`/api/content/${params.id}`);
    const d = await r.json();
    setContent(d.data);
    setLoading(false);
  };
  useEffect(()=>{load();},[params.id]);

  const copy = (text:string, id:string) => {
    navigator.clipboard.writeText(text);
    setCopied(id); toast.success('คัดลอกแล้ว!');
    setTimeout(()=>setCopied(null),2000);
  };

  const selectVersion = async (vid:string) => {
    await fetch(`/api/content/${params.id}/versions`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({version_id:vid})});
    toast.success('เลือกเวอร์ชันแล้ว'); load();
  };

  const updateStatus = async (s:string) => {
    await fetch(`/api/content/${params.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:s})});
    toast.success(`อัพเดตเป็น "${STATUS_LABEL[s]}" แล้ว`); load();
  };

  const schedule = async () => {
    if(!scheduleDate) return toast.error('เลือกวันเวลา');
    setScheduling(true);
    try {
      const r = await fetch('/api/schedule',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({content_id:params.id,scheduled_at:new Date(scheduleDate).toISOString(),platform:content?.platform||'threads'})});
      if(!r.ok) throw new Error();
      toast.success('📅 ตั้งเวลาเผยแพร่แล้ว!'); setShowSched(false); load();
    } catch { toast.error('เกิดข้อผิดพลาด'); } finally { setScheduling(false); }
  };

  const del = async () => {
    if(!confirm('ลบเนื้อหานี้?'))return;
    await fetch(`/api/content/${params.id}`,{method:'DELETE'});
    toast.success('ลบแล้ว'); router.push('/dashboard/content');
  };

  if(loading) return <div className="max-w-5xl mx-auto space-y-4">{[...Array(3)].map((_,i)=><div key={i} className="skeleton h-32 rounded-2xl"/>)}</div>;
  if(!content) return <div className="text-center py-16 text-gray-400">ไม่พบเนื้อหา</div>;

  const selVer = content.content_versions?.find(v=>v.is_selected);
  const otherVers = content.content_versions?.filter(v=>!v.is_selected)||[];

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/content" className="btn-ghost p-2 mt-0.5"><ArrowLeft className="w-5 h-5"/></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold text-gray-900 truncate">{content.title||'ไม่มีชื่อ'}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn('badge',STATUS_COLOR[content.status])}>{STATUS_LABEL[content.status]}</span>
            <span className="text-sm text-gray-400">{PLATFORM_ICON[content.platform]} {content.platform}</span>
            <span className="text-sm text-gray-400">{formatDate(content.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setShowSched(!showSched)} className="btn-secondary"><Calendar className="w-4 h-4"/>ตั้งเวลา</button>
          <button onClick={del} className="btn-secondary text-red-500 border-red-200"><Trash2 className="w-4 h-4"/></button>
        </div>
      </div>

      {/* Schedule */}
      {showSched && (
        <div className="card border-blue-200 bg-blue-50/50 animate-slide-up">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4"/>ตั้งเวลาเผยแพร่</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label text-blue-800">วันและเวลา</label>
              <input type="datetime-local" className="input" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} min={new Date().toISOString().slice(0,16)}/>
            </div>
            <button onClick={schedule} disabled={scheduling} className="btn-primary">
              {scheduling?<Loader2 className="w-4 h-4 animate-spin"/>:<Calendar className="w-4 h-4"/>}ยืนยัน
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="card">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-600">เปลี่ยนสถานะ:</span>
          {['draft','pending','published','archived'].filter(s=>s!==content.status).map(s=>(
            <button key={s} onClick={()=>updateStatus(s)} className={cn('badge cursor-pointer hover:opacity-80 py-1',STATUS_COLOR[s])}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {/* Selected version */}
          {selVer && (
            <div className="card border-shopee-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-shopee-600"/>เวอร์ชันที่ใช้ #{selVer.version_number}</h2>
                <div className="flex gap-2">
                  {editing===selVer.id ? (
                    <button onClick={()=>setEditing(null)} className="btn-primary py-1 px-2 text-xs"><Save className="w-3 h-3"/>บันทึก</button>
                  ) : (
                    <button onClick={()=>{setEditing(selVer.id);setEditText(selVer.text);}} className="btn-secondary py-1 px-2 text-xs"><Edit2 className="w-3 h-3"/>แก้ไข</button>
                  )}
                  <button onClick={()=>copy(selVer.text,selVer.id)} className="btn-secondary py-1 px-2 text-xs">
                    {copied===selVer.id?<Check className="w-3 h-3 text-green-600"/>:<Copy className="w-3 h-3"/>}คัดลอก
                  </button>
                </div>
              </div>
              {editing===selVer.id ? (
                <textarea className="input min-h-[180px] resize-y text-sm leading-relaxed" value={editText} onChange={e=>setEditText(e.target.value)}/>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selVer.text}</div>
              )}
              <p className="text-xs text-gray-400 mt-2">{selVer.word_count} คำ</p>
            </div>
          )}

          {/* Other versions */}
          {otherVers.length>0 && (
            <div className="card">
              <h3 className="font-medium text-gray-700 mb-3">เวอร์ชันอื่น ({otherVers.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {otherVers.map(v=>(
                  <div key={v.id} className="border border-gray-100 rounded-xl p-3 hover:border-shopee-200 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-600">เวอร์ชัน {v.version_number}</span>
                      <div className="flex gap-2">
                        <button onClick={()=>selectVersion(v.id)} className="text-xs text-shopee-600 font-medium hover:underline">ใช้งาน</button>
                        <button onClick={()=>copy(v.text,v.id)} className="text-xs text-gray-400 hover:text-gray-600">{copied===v.id?'✅':'คัดลอก'}</button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{v.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source */}
          <div className="card">
            <h3 className="font-medium text-gray-700 mb-2">ข้อความต้นฉบับ</h3>
            {content.source_url && (
              <a href={content.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-shopee-600 hover:underline mb-2">
                <ExternalLink className="w-3 h-3"/>{content.source_url}
              </a>
            )}
            {content.source_text && <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 max-h-28 overflow-auto">{content.source_text}</div>}
            {content.translated_text && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-1">🇹🇭 คำแปล</p>
                <div className="bg-blue-50 rounded-lg p-3 text-xs text-gray-700 max-h-28 overflow-auto">{content.translated_text}</div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-shopee-600"/>สินค้า</h3>
            {content.content_products?.length ? content.content_products.map(cp=>cp.product&&(
              <div key={cp.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg mb-2">
                {cp.product.image_url&&<img src={cp.product.image_url} alt="" className="w-8 h-8 rounded object-cover"/>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{cp.product.name_th||cp.product.name}</p>
                  <p className="text-xs text-shopee-600">฿{cp.product.price}</p>
                </div>
                <a href={cp.product.affiliate_url||cp.product.shopee_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-shopee-600"/>
                </a>
              </div>
            )) : <p className="text-sm text-gray-400 text-center py-3">ไม่มีสินค้า</p>}
          </div>

          {content.scheduled_at && (
            <div className="card border-blue-200 bg-blue-50/50">
              <h3 className="font-medium text-blue-800 mb-1.5 flex items-center gap-2"><Calendar className="w-4 h-4"/>กำหนดเผยแพร่</h3>
              <p className="font-semibold text-blue-900 text-sm">{formatDate(content.scheduled_at)}</p>
            </div>
          )}

          {content.media_urls?.length>0 && (
            <div className="card">
              <h3 className="font-medium text-gray-700 mb-2">รูป/วิดีโอ</h3>
              <div className="flex flex-wrap gap-2">
                {content.media_urls.map((url,i)=>(
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border hover:border-shopee-300 transition-colors">
                    <img src={url} alt="" className="w-full h-full object-cover"/>
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">คลิกเพื่อดาวน์โหลด</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
