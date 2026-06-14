'use client';
import { useEffect, useState } from 'react';
import { TrendingUp, ShoppingBag, MousePointer, DollarSign } from 'lucide-react';
import { formatTHB } from '@/lib/utils';

export default function AnalyticsPage() {
  const [data, setData] = useState<{
    content:{total:number;published:number};
    products:{total:number;active:number};
    analytics:{clicks:number;conversions:number;revenue:number};
  }|null>(null);

  useEffect(()=>{
    fetch('/api/analytics?type=dashboard').then(r=>r.json()).then(setData);
  },[]);

  const rate = data?.analytics.clicks&&data.analytics.conversions
    ? ((data.analytics.conversions/data.analytics.clicks)*100).toFixed(1) : '0';

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">วิเคราะห์ผล</h1>
        <p className="text-gray-500 text-sm">ติดตามประสิทธิภาพ Affiliate</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {label:'คลิกทั้งหมด',value:data?.analytics.clicks||0,icon:MousePointer,color:'bg-blue-50 text-blue-600'},
          {label:'Conversion',value:data?.analytics.conversions||0,icon:ShoppingBag,color:'bg-green-50 text-green-600'},
          {label:'Conversion Rate',value:`${rate}%`,icon:TrendingUp,color:'bg-purple-50 text-purple-600'},
          {label:'รายได้รวม',value:formatTHB(data?.analytics.revenue||0),icon:DollarSign,color:'bg-shopee-50 text-shopee-600'},
        ].map(s=>(
          <div key={s.label} className="card flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <s.icon className="w-5 h-5"/>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">📊 วิธีเพิ่มประสิทธิภาพ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {icon:'🧵',title:'โพสต์สม่ำเสมอ',desc:'1 โพสต์/วัน ดีกว่า 7 โพสต์/สัปดาห์'},
            {icon:'🎯',title:'เลือก Hook ที่แข็งแกร่ง',desc:'ประโยคแรกสำคัญมาก ทดสอบหลายเวอร์ชัน'},
            {icon:'🛍️',title:'สินค้าตรงกลุ่ม',desc:'เด็ก/สัตว์/ความงาม แยกบัญชีชัดเจน'},
          ].map(t=>(
            <div key={t.title} className="bg-gray-50 rounded-xl p-4">
              <span className="text-2xl">{t.icon}</span>
              <h3 className="font-semibold text-gray-800 mt-2 text-sm">{t.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-gradient-to-br from-shopee-50 to-orange-50 border-shopee-200">
        <h2 className="font-semibold text-shopee-800 mb-2">🚀 Phase 2: Shopee Affiliate API</h2>
        <p className="text-sm text-shopee-700 mb-3">เมื่อได้รับอนุมัติ API จาก Shopee จะสามารถ:</p>
        <div className="grid grid-cols-2 gap-2">
          {['ค้นหาสินค้าอัตโนมัติ','สร้าง Affiliate Link อัตโนมัติ','ดูสถิติ Real-time','ติดตามยอดขายแต่ละโพสต์'].map(f=>(
            <div key={f} className="flex items-center gap-2 text-sm text-shopee-700">
              <span className="text-shopee-500">✓</span>{f}
            </div>
          ))}
        </div>
        <a href="https://affiliate.shopee.co.th" target="_blank" rel="noopener noreferrer"
          className="btn-primary mt-4 inline-flex">สมัคร API →</a>
      </div>
    </div>
  );
}
