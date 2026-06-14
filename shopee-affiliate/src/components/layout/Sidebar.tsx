'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, LayoutDashboard, FileText, Package, Calendar, BarChart3, Settings, ChevronLeft, Menu } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV = [
  { href:'/dashboard', icon:LayoutDashboard, label:'แดชบอร์ด', exact:true },
  { href:'/dashboard/content', icon:FileText, label:'คลังเนื้อหา' },
  { href:'/dashboard/products', icon:Package, label:'คลังสินค้า' },
  { href:'/dashboard/schedule', icon:Calendar, label:'ตารางเผยแพร่' },
  { href:'/dashboard/analytics', icon:BarChart3, label:'วิเคราะห์ผล' },
  { href:'/dashboard/settings', icon:Settings, label:'ตั้งค่า' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={cn('bg-white border-r border-gray-100 flex flex-col transition-all duration-300 shadow-sm z-20 flex-shrink-0', collapsed ? 'w-16' : 'w-60')}>
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="w-9 h-9 bg-shopee-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="font-display font-bold text-gray-900 text-sm leading-tight">Shopee TH</div>
            <div className="text-xs text-gray-400">Affiliate Auto</div>
          </div>
        )}
        <button onClick={()=>setCollapsed(!collapsed)} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
          {collapsed ? <Menu className="w-4 h-4"/> : <ChevronLeft className="w-4 h-4"/>}
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({href,icon:Icon,label,exact}) => {
          const active = exact ? pathname===href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} title={label}
              className={cn('sidebar-link', active && 'active', collapsed && 'justify-center px-2')}>
              <Icon className="w-5 h-5 flex-shrink-0"/>
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
      {!collapsed && (
        <div className="p-3 border-t border-gray-100">
          <div className="bg-shopee-50 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-shopee-700">🧵 Threads → 🇹🇭 Thai</p>
            <p className="text-xs text-gray-400 mt-0.5">→ Shopee Affiliate</p>
          </div>
        </div>
      )}
    </aside>
  );
}
