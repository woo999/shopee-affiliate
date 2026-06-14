'use client';
import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, Trash2, Bell } from 'lucide-react';
import type { Schedule } from '@/types';
import { cn, formatDate, PLATFORM_ICON, isDueSoon, isUpcoming } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'upcoming'|'done'>('upcoming');

  const load = async () => {
    setLoading(true);
    const r = await fetch('/api/schedule');
    const d = await r.json();
    setSchedules(d.data||[]);
    setLoading(false);
  };
  useEffect(()=>{load();},[]);

  // Browser notification
  useEffect(()=>{
    if(!('Notification' in window)) return;
    if(Notification.permission==='default') Notification.requestPermission();
    const check = () => {
      schedules.forEach(s=>{
        if(!s.is_done && isDueSoon(s.scheduled_at)) {
          new Notification('⏰ ถึงเวลาโพสต์แล้ว!', {
            body: `${s.content?.title||'เนื้อหา'} บน ${s.platform}`,
            icon: '/favicon.ico'
          });
        }
      });
    };
    const t = setInterval(check, 60000);
    return ()=>clearInterval(t);
  },[schedules]);

  const del = async(id:string)=>{
    await fetch(`/api/schedule?id=${id}`,{method:'DELETE'});
    toast.success('ลบกำหนดการแล้ว'); load();
  };

  const markDone = async(s:Schedule)=>{
    await fetch(`/api/content/${s.content_id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'published',published_at:new Date().toISOString()})});
    toast.success('✅ บันทึกว่าเผยแพร่แล้ว!'); load();
  };

  const filtered = schedules.filter(s=>{
    if(filter==='upcoming') return !s.is_done && isUpcoming(s.scheduled_at);
    if(filter==='done') return s.is_done;
    return true;
  });

  const dueSoon = schedules.filter(s=>!s.is_done&&isDueSoon(s.scheduled_at));

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">ตารางเผยแพร่</h1>
        <p className="text-gray-500 text-sm">กำหนดการโพสต์และการแจ้งเตือน</p>
      </div>

      {/* Due soon alert */}
      {dueSoon.length>0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-slide-up">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
            <Bell className="w-5 h-5 animate-bounce"/>⚠️ ถึงเวลาโพสต์ใน 2 ชั่วโมง!
          </h3>
          {dueSoon.map(s=>(
            <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-3 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{PLATFORM_ICON[s.platform]||'📱'}</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">{s.content?.title||'ไม่มีชื่อ'}</p>
                  <p className="text-xs text-red-600 font-semibold">{formatDate(s.scheduled_at,'dd MMM HH:mm')}</p>
                </div>
              </div>
              <button onClick={()=>markDone(s)} className="btn-primary py-1.5 px-3 text-xs">
                <CheckCircle className="w-3.5 h-3.5"/>โพสต์แล้ว
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {(['upcoming','all','done'] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={cn('px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
              filter===f?'bg-shopee-600 text-white border-shopee-600':'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {f==='upcoming'?'⏳ ที่จะมาถึง':f==='all'?'📋 ทั้งหมด':'✅ เสร็จแล้ว'}
          </button>
        ))}
      </div>

      {loading ? [...Array(4)].map((_,i)=><div key={i} className="skeleton h-20 rounded-2xl"/>) :
       filtered.length===0 ? (
        <div className="card text-center py-16">
          <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3"/>
          <p className="text-gray-400">ไม่มีกำหนดการ</p>
          <p className="text-sm text-gray-400 mt-1">ตั้งเวลาโพสต์ได้จากหน้า <Link href="/dashboard/content" className="text-shopee-600 hover:underline">คลังเนื้อหา</Link></p>
        </div>
       ) : (
        <div className="space-y-2">
          {filtered.sort((a,b)=>new Date(a.scheduled_at).getTime()-new Date(b.scheduled_at).getTime()).map(s=>{
            const soon = isDueSoon(s.scheduled_at) && !s.is_done;
            const past = !isUpcoming(s.scheduled_at) && !s.is_done;
            return (
              <div key={s.id} className={cn('card flex items-center gap-4',
                soon&&'border-red-200 bg-red-50/50',
                past&&'border-orange-200 bg-orange-50/30')}>
                <span className="text-2xl flex-shrink-0">{PLATFORM_ICON[s.platform]||'📱'}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/content/${s.content_id}`} className="font-semibold text-gray-900 hover:text-shopee-600 transition-colors text-sm truncate block">
                    {s.content?.title||'ไม่มีชื่อ'}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className={cn('w-3.5 h-3.5 flex-shrink-0',soon?'text-red-500':'text-gray-400')}/>
                    <p className={cn('text-xs font-medium',soon?'text-red-600':past?'text-orange-500':'text-gray-500')}>
                      {formatDate(s.scheduled_at,'dd MMM yyyy HH:mm')}
                      {soon&&' — ใกล้ถึงเวลาแล้ว!'}
                      {past&&' — เกินกำหนด'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!s.is_done && (
                    <button onClick={()=>markDone(s)} className="btn-secondary py-1.5 px-3 text-xs text-green-600 border-green-200">
                      <CheckCircle className="w-3.5 h-3.5"/>โพสต์แล้ว
                    </button>
                  )}
                  {s.is_done && <span className="badge bg-green-100 text-green-700 py-1">✅ เสร็จ</span>}
                  <button onClick={()=>del(s.id)} className="btn-ghost p-2 text-red-400 hover:bg-red-50">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
       )}
    </div>
  );
}
