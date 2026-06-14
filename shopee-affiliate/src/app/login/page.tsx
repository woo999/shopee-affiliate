'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShoppingBag, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<'login'|'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('เข้าสู่ระบบสำเร็จ!');
        router.push('/dashboard');
        window.location.href = '/dashboard';
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (error) throw error;
        toast.success('สมัครสำเร็จ! ตรวจสอบอีเมล');
        setMode('login');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-shopee-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-shopee-100 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-100 rounded-full opacity-30 blur-3xl" />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-shopee-600 rounded-2xl shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Shopee <span className="text-shopee-600">TH</span></h1>
          <p className="text-gray-500 text-sm mt-1">Affiliate Automation Platform</p>
          <p className="text-xs text-gray-400 mt-0.5">Threads → แปลภาษา → Shopee Link</p>
        </div>
        <div className="card shadow-xl">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            {(['login','signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode===m ? 'bg-white text-shopee-700 shadow-sm' : 'text-gray-500'}`}>
                {m==='login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode==='signup' && (
              <div>
                <label className="label">ชื่อ</label>
                <input className="input" placeholder="ชื่อ-นามสกุล" value={name} onChange={e=>setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="label">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" className="input pl-10" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={show?'text':'password'} className="input pl-10 pr-10" placeholder="อย่างน้อย 6 ตัวอักษร" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 text-base">
              {loading && <Loader2 className="w-4 h-4 animate-spin"/>}
              {mode==='login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
