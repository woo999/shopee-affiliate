'use client';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, Bell, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Profile } from '@/types';

export default function TopBar({ user }: { user: Profile | null }) {
  const router = useRouter();
  const supabase = createClient();
  const logout = async () => {
    await supabase.auth.signOut();
    toast.success('ออกจากระบบแล้ว');
    router.push('/login');
    router.refresh();
  };
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
      <p className="text-sm text-gray-500">
        🇹🇭 ยินดีต้อนรับ, <span className="font-semibold text-gray-900">{user?.full_name || user?.email || 'ผู้ใช้งาน'}</span>
      </p>
      <div className="flex items-center gap-1">
        <Link href="/dashboard/schedule" className="btn-ghost p-2 relative">
          <Bell className="w-5 h-5"/>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-shopee-500 rounded-full animate-pulse-dot"/>
        </Link>
        <Link href="/dashboard/settings" className="btn-ghost p-2"><User className="w-5 h-5"/></Link>
        <button onClick={logout} className="btn-ghost p-2 text-red-500 hover:bg-red-50"><LogOut className="w-5 h-5"/></button>
      </div>
    </header>
  );
}
