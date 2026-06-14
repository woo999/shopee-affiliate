'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Package, TrendingUp, Calendar, Plus, Clock } from 'lucide-react';
import { cn, formatDate, PLATFORM_ICON, STATUS_COLOR, STATUS_LABEL, CATEGORY_ICON, formatTHB } from '@/lib/utils';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics?type=dashboard').then(r=>r.json()).then(d=>setData(d)).finally(()=>setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-5 animate-pulse max-w-6xl">
      <div className="skeleton h-8 w-48 rounded-lg"/>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_,i)=><div key={i} className="skeleton h-28 rounded-2xl"/>)}
      </div>
    </div>
  );

  const stats = [
    { label:'เนื้อหาทั้งหมด', value:data?.content.total||0, sub:`รอดำเนินการ ${data?.content.pending||0}`, icon:FileText, color:'bg-blue-50 text-blue-600', href:'/dashboard/content' },
    { label:'สินค้า Active', value:data?.products.active||0, sub:`จาก ${data?.products.total||0} รายการ`, icon:Package, color:'bg-green-50 text-green-600', href:'/dashboard/products' },
    { label:'คลิกทั้งหมด', value:data?.analytics.clicks||0, sub:`${data?.analytics.conversions||0} conversion`, icon:TrendingUp, color:'bg-purple-50 text-purple-600', href:'/dashboard/analytics' },
    { label:'รายได้รวม', value:formatTHB(data?.analytics.revenue||0), sub:'ทั้งหมด', icon:TrendingUp, color:'bg-shopee-50 text-shopee-600', href:'/dashboard/analytics' },
  ];

  return (
    <div className="space-y-5 animate-fade-in max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-500 text-sm">ภาพรวม Shopee Affiliate</p>
        </div>
        <Link href="/dashboard/content/new" className="btn-primary">
          <Plus className="w-4 h-4"/>สร้างเนื้อหาใหม่
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s=>(
          <Link key={s.label} href={s.href} className="card hover:shadow-md transition-shadow flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.color)}>
              <s.icon className="w-5 h-5"/>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs font-medium text-gray-700">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-shopee-600"/>กำหนดการที่จะมาถึง
            </h2>
            <Link href="/dashboard/schedule" className="text-xs text-shopee-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          {(!data?.upcoming || data.upcoming.length===0) ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">ไม่มีกำหนดการ</p>
            </div>
          ) : data.upcoming.map(s=>(
            <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
              <span className="text-2xl">{PLATFORM_ICON[s.platform]||'📱'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{s.content?.title||'ไม่มีชื่อ'}</p>
                <p className="text-xs text-gray-500">{formatDate(s.scheduled_at,'dd MMM HH:mm')}</p>
              </div>
              <Clock className="w-4 h-4 text-blue-400 flex-shrink-0"/>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-shopee-600"/>เนื้อหาล่าสุด
            </h2>
            <Link href="/dashboard/content" className="text-xs text-shopee-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          {(!data?.recent || data.recent.length===0) ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">ยังไม่มีเนื้อหา</p>
              <Link href="/dashboard/content/new" className="text-xs text-shopee-600 hover:underline mt-1 block">สร้างเลย →</Link>
            </div>
          ) : data.recent.map(c=>(
            <Link key={c.id} href={`/dashboard/content/${c.id}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors mb-1">
              <span className="text-xl">{PLATFORM_ICON[c.platform]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.title||'ไม่มีชื่อ'}</p>
                <p className="text-xs text-gray-400">{formatDate(c.created_at)}</p>
              </div>
              <span className={cn('badge', STATUS_COLOR[c.status])}>{STATUS_LABEL[c.status]}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">ดำเนินการด่วน</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {label:'สร้างเนื้อหาจาก Threads',icon:'🧵',href:'/dashboard/content/new',color:'bg-shopee-50 hover:bg-shopee-100 text-shopee-700 border-shopee-200'},
            {label:'เพิ่มสินค้าใหม่',icon:'📦',href:'/dashboard/products/new',color:'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'},
            {label:'ดูตารางเผยแพร่',icon:'📅',href:'/dashboard/schedule',color:'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'},
            {label:'ดูรายงาน',icon:'📊',href:'/dashboard/analytics',color:'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'},
          ].map(a=>(
            <Link key={a.label} href={a.href}
              className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-colors text-center', a.color)}>
              <span className="text-2xl">{a.icon}</span>
              <span className="leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
