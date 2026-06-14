'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Link2, Sparkles, Languages, ShoppingBag, Save, ChevronRight, Check, Loader2, Copy, X, Plus, Download, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, CATEGORY_ICON, CATEGORY_LABEL } from '@/lib/utils';
import type { Product } from '@/types';
import Link from 'next/link';

type Step = 1|2|3|4|5;

interface Version { version_number:number; style:string; text:string; word_count:number; }

const CATEGORIES = ['baby','pet','beauty','other'] as const;
const PLATFORMS = ['threads','facebook','instagram','tiktok','line'] as const;

export default function NewContentPage() {
  const router = useRouter();

  // Data
  const [step, setStep] = useState<Step>(1);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [title, setTitle] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [translatedText, setTranslatedText] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [platform, setPlatform] = useState<string>('threads');
  const [category, setCategory] = useState<string>('beauty');

  // Products search
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  // Loading
  const [extracting, setExtracting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Step 1: Extract ──────────────────────────
  const handleExtract = async () => {
    if (!sourceUrl) return toast.error('กรุณากรอก URL');
    setExtracting(true);
    try {
      const res = await fetch('/api/content/extract', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ url: sourceUrl }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSourceText(d.source_text || '');
      setTitle(d.title || '');
      setMediaUrls(d.media_urls || []);
      toast.success('ดึงข้อความสำเร็จ!');
    } catch(e) { toast.error(e instanceof Error ? e.message : 'ไม่สำเร็จ'); }
    finally { setExtracting(false); }
  };

  // ── Step 2: Translate ─────────────────────────
  const handleTranslate = async () => {
    if (!sourceText) return toast.error('ไม่มีข้อความ');
    setTranslating(true);
    try {
      const res = await fetch('/api/content/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'translate', text:sourceText }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setTranslatedText(d.translated_text);
      toast.success('แปลสำเร็จ!');
    } catch(e) { toast.error(e instanceof Error ? e.message : 'ไม่สำเร็จ'); }
    finally { setTranslating(false); }
  };

  // ── Step 3: Products ──────────────────────────
  const loadProducts = useCallback(async (q='') => {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&category=${category}&limit=30`);
      const d = await res.json();
      setProducts(d.data || []);
    } finally { setProductLoading(false); }
  }, [category]);

  const toggleProduct = (p: Product) => {
    setSelectedProducts(prev =>
      prev.find(x=>x.id===p.id) ? prev.filter(x=>x.id!==p.id) : [...prev, p]
    );
  };

  // ── Step 4: Generate ──────────────────────────
  const handleGenerate = async () => {
    if (!sourceText && !translatedText) return toast.error('ไม่มีข้อความ');
    setGenerating(true);
    try {
      const res = await fetch('/api/content/ai', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          action:'generate_versions',
          source_text: sourceText,
          translated_text: translatedText,
          product_names: selectedProducts.map(p=>p.name_th||p.name),
          category,
          count: 10,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setVersions(d.versions || []);
      setSelectedVersionIdx(0);
      toast.success(`สร้าง ${d.versions?.length||0} เวอร์ชันสำเร็จ!`);
    } catch(e) { toast.error(e instanceof Error ? e.message : 'ไม่สำเร็จ'); }
    finally { setGenerating(false); }
  };

  // Insert affiliate links
  const insertLinks = (text: string) => {
    let t = text;
    const links = selectedProducts.map(p=>p.affiliate_url||p.shopee_url).filter(Boolean);
    if (links.length === 0) return t;
    if (t.includes('[LINK]')) {
      links.forEach(l => { t = t.replace('[LINK]', l); });
    } else {
      t += '\n\n' + links.map(l=>`🛍️ ${l}`).join('\n');
    }
    return t;
  };

  // ── Step 5: Save ──────────────────────────────
  const handleSave = async (status: 'draft'|'pending') => {
    if (!sourceText && !translatedText) return toast.error('ไม่มีเนื้อหา');
    setSaving(true);
    try {
      // 1. Create content
      const cr = await fetch('/api/content', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          title: title || sourceUrl || 'เนื้อหาใหม่',
          source_url: sourceUrl||null,
          source_text: sourceText,
          translated_text: translatedText,
          media_urls: mediaUrls,
          status, platform, category,
        }),
      });
      const cd = await cr.json();
      if (!cr.ok) throw new Error(cd.error);
      const cid = cd.data.id;

      // 2. Save versions with links inserted
      if (versions.length > 0) {
        const vWithLinks = versions.map(v => ({
          ...v, text: insertLinks(v.text),
        }));
        await fetch(`/api/content/${cid}/versions`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ versions: vWithLinks, product_ids: selectedProducts.map(p=>p.id) }),
        });
      }

      toast.success(status==='pending' ? '✅ บันทึกและรอดำเนินการแล้ว!' : '💾 บันทึกแบบร่างแล้ว!');
      router.push(`/dashboard/content/${cid}`);
    } catch(e) { toast.error(e instanceof Error ? e.message : 'ไม่สำเร็จ'); }
    finally { setSaving(false); }
  };

  const selectedVersion = versions[selectedVersionIdx];
  const steps = [
    {n:1,label:'ดึงข้อความ',icon:'🧵'},
    {n:2,label:'แปลไทย',icon:'🇹🇭'},
    {n:3,label:'เลือกสินค้า',icon:'🛍️'},
    {n:4,label:'AI สร้าง',icon:'✨'},
    {n:5,label:'บันทึก',icon:'💾'},
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/content" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5"/></Link>
        <div>
          <h1 className="text-xl font-display font-bold text-gray-900">สร้างเนื้อหาใหม่</h1>
          <p className="text-gray-500 text-xs">Threads URL → แปลภาษา → AI ปรับ → Shopee Link</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="card py-3">
        <div className="flex items-center justify-between">
          {steps.map(({n,label,icon},i) => (
            <div key={n} className="flex items-center gap-1 flex-1">
              <button onClick={()=>setStep(n as Step)}
                className={cn('flex flex-col items-center gap-1 flex-1 py-1 px-2 rounded-xl transition-all',
                  step===n ? 'bg-shopee-50 text-shopee-700' : step>n ? 'text-green-600' : 'text-gray-400 hover:text-gray-600')}>
                <span className="text-lg">{step>n ? '✅' : icon}</span>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </button>
              {i<steps.length-1 && <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0"/>}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1 ─────────────────────────────── */}
      {step===1 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-shopee-600"/>ขั้นที่ 1: วาง Threads URL
          </h2>

          <div className="flex gap-2">
            <input type="url" className="input flex-1" placeholder="https://www.threads.net/@username/post/..."
              value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleExtract()}/>
            <button onClick={handleExtract} disabled={extracting||!sourceUrl} className="btn-primary flex-shrink-0">
              {extracting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
              {extracting ? 'กำลังดึง...' : 'ดึงข้อความ'}
            </button>
          </div>

          {/* Media preview */}
          {mediaUrls.length>0 && (
            <div>
              <p className="label">รูป/วิดีโอที่พบ ({mediaUrls.length})</p>
              <div className="flex gap-2 flex-wrap">
                {mediaUrls.map((url,i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="relative group w-20 h-20 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:border-shopee-300 transition-colors">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Download className="w-4 h-4 text-white opacity-0 group-hover:opacity-100"/>
                    </div>
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">คลิกเพื่อเปิดและบันทึกรูป/วิดีโอ</p>
            </div>
          )}

          {title && (
            <div>
              <label className="label">หัวข้อ</label>
              <input className="input" value={title} onChange={e=>setTitle(e.target.value)}/>
            </div>
          )}

          <div>
            <label className="label">ข้อความต้นฉบับ <span className="text-gray-400 font-normal">(วางเองหรือดึงจาก URL)</span></label>
            <textarea className="input min-h-[140px] resize-y text-sm font-mono"
              placeholder="วางข้อความจาก Threads หรือดึงจาก URL ด้านบน..."
              value={sourceText} onChange={e=>setSourceText(e.target.value)}/>
            <p className="text-xs text-gray-400 mt-1">{sourceText.length} ตัวอักษร</p>
          </div>

          {/* Category + Platform */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">หมวดหมู่</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setCategory(c)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      category===c ? 'bg-shopee-600 text-white border-shopee-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
                    {CATEGORY_ICON[c]} {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">แพลตฟอร์ม</label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map(p=>(
                  <button key={p} onClick={()=>setPlatform(p)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      platform===p ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200')}>
                    {p==='threads'?'🧵':p==='facebook'?'📘':p==='instagram'?'📸':p==='tiktok'?'🎵':'💬'} {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={()=>setStep(2)} disabled={!sourceText} className="btn-primary">
              ถัดไป <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2 ─────────────────────────────── */}
      {step===2 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Languages className="w-5 h-5 text-shopee-600"/>ขั้นที่ 2: แปลเป็นภาษาไทย
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">ต้นฉบับ</label>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-600 min-h-[180px] whitespace-pre-wrap overflow-auto">
                {sourceText}
              </div>
            </div>
            <div>
              <label className="label">ภาษาไทย</label>
              <textarea className="input min-h-[180px] resize-y text-sm"
                placeholder="คลิก 'แปลอัตโนมัติ' หรือพิมพ์เอง..."
                value={translatedText} onChange={e=>setTranslatedText(e.target.value)}/>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={handleTranslate} disabled={translating||!sourceText} className="btn-secondary">
              {translating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Languages className="w-4 h-4"/>}
              {translating ? 'กำลังแปล...' : 'แปลอัตโนมัติ (AI)'}
            </button>
            <div className="flex gap-2">
              <button onClick={()=>setStep(1)} className="btn-ghost">ย้อนกลับ</button>
              <button onClick={()=>setStep(3)} disabled={!translatedText&&!sourceText} className="btn-primary">
                ถัดไป <ChevronRight className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 ─────────────────────────────── */}
      {step===3 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-shopee-600"/>ขั้นที่ 3: เลือกสินค้า Shopee
          </h2>

          {selectedProducts.length>0 && (
            <div>
              <label className="label">สินค้าที่เลือก ({selectedProducts.length})</label>
              <div className="flex flex-wrap gap-2">
                {selectedProducts.map(p=>(
                  <div key={p.id} className="flex items-center gap-2 bg-shopee-50 text-shopee-700 border border-shopee-200 px-3 py-1.5 rounded-full text-xs">
                    {p.image_url && <img src={p.image_url} alt="" className="w-4 h-4 rounded object-cover"/>}
                    <span className="font-medium">{p.name_th||p.name}</span>
                    <button onClick={()=>toggleProduct(p)}><X className="w-3 h-3 hover:text-red-500"/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input className="input flex-1" placeholder="ค้นหาสินค้า..."
              value={productSearch} onChange={e=>setProductSearch(e.target.value)}
              onFocus={()=>products.length===0&&loadProducts('')}/>
            <button onClick={()=>loadProducts(productSearch)} className="btn-secondary flex-shrink-0">ค้นหา</button>
          </div>

          {/* วิธีเพิ่มลิงก์ affiliate */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">📋 วิธีเพิ่ม Affiliate Link</p>
            <ol className="text-xs text-amber-700 space-y-0.5 list-decimal list-inside">
              <li>ไปที่ <a href="https://affiliate.shopee.co.th" target="_blank" rel="noopener noreferrer" className="underline font-medium">affiliate.shopee.co.th</a></li>
              <li>ค้นหาสินค้าและคัดลอกลิงก์ Affiliate</li>
              <li>เพิ่มสินค้าใหม่ที่ <Link href="/dashboard/products/new" className="underline font-medium">คลังสินค้า</Link></li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
            {productLoading ? [...Array(4)].map((_,i)=><div key={i} className="skeleton h-20 rounded-xl"/>) :
             products.length===0 ? (
              <div className="col-span-2 text-center py-8 text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">ยังไม่มีสินค้า</p>
                <Link href="/dashboard/products/new" className="text-xs text-shopee-600 hover:underline">+ เพิ่มสินค้าใหม่</Link>
              </div>
             ) : products.filter(p=>
               !productSearch||p.name.toLowerCase().includes(productSearch.toLowerCase())||(p.name_th||'').includes(productSearch)
             ).map(p=>{
              const sel = selectedProducts.some(x=>x.id===p.id);
              return (
                <button key={p.id} onClick={()=>toggleProduct(p)}
                  className={cn('flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    sel ? 'border-shopee-400 bg-shopee-50' : 'border-gray-200 hover:border-shopee-200 bg-white')}>
                  {p.image_url ? <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0"/>
                    : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5 text-gray-400"/></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name_th||p.name}</p>
                    <p className="text-xs text-shopee-600">฿{p.price||'-'}</p>
                    {p.commission_rate && <p className="text-xs text-green-600">คอม {p.commission_rate}%</p>}
                  </div>
                  {sel && <Check className="w-4 h-4 text-shopee-600 flex-shrink-0"/>}
                </button>
              );
             })}
          </div>

          <div className="flex justify-between">
            <button onClick={()=>setStep(2)} className="btn-ghost">ย้อนกลับ</button>
            <button onClick={()=>setStep(4)} className="btn-primary">ถัดไป <ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      {/* ── STEP 4 ─────────────────────────────── */}
      {step===4 && (
        <div className="card space-y-4 animate-slide-up">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-shopee-600"/>ขั้นที่ 4: AI สร้าง 10 เวอร์ชัน
          </h2>

          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
            {generating ? 'AI กำลังสร้าง...' : versions.length>0 ? 'สร้างใหม่' : 'สร้าง 10 เวอร์ชัน'}
          </button>
          {generating && <p className="text-sm text-gray-500 animate-pulse">กำลังสร้างเนื้อหาหลากหลายสไตล์...</p>}

          {versions.length>0 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Version list */}
              <div className="lg:col-span-2 space-y-1.5 max-h-[480px] overflow-y-auto">
                {versions.map((v,i)=>(
                  <button key={i} onClick={()=>setSelectedVersionIdx(i)}
                    className={cn('w-full text-left p-3 rounded-xl border text-xs transition-all',
                      selectedVersionIdx===i ? 'border-shopee-400 bg-shopee-50' : 'border-gray-200 hover:border-gray-300 bg-white')}>
                    <div className="font-semibold text-gray-700 mb-0.5">#{v.version_number} <span className="text-gray-400 font-normal">{v.style}</span></div>
                    <p className="text-gray-600 line-clamp-2">{v.text.substring(0,80)}...</p>
                    <p className="text-gray-400 mt-1">{v.word_count} คำ</p>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="lg:col-span-3">
                {selectedVersion && (
                  <div className="border border-shopee-200 rounded-xl p-4 bg-white h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-shopee-700">#{selectedVersion.version_number} – {selectedVersion.style}</span>
                      <button onClick={()=>{
                        navigator.clipboard.writeText(insertLinks(selectedVersion.text));
                        toast.success('คัดลอกแล้ว!');
                      }} className="btn-ghost py-1 px-2 text-xs">
                        <Copy className="w-3 h-3"/>คัดลอก
                      </button>
                    </div>
                    <textarea
                      className="w-full text-sm text-gray-800 bg-transparent border-none outline-none resize-none min-h-[220px] leading-relaxed"
                      value={selectedVersion.text}
                      onChange={e=>{
                        setVersions(prev=>prev.map((v,i)=>i===selectedVersionIdx?{...v,text:e.target.value}:v));
                      }}
                    />
                    {selectedProducts.length>0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">🛍️ Affiliate links ที่จะแทรก:</p>
                        {selectedProducts.map(p=>(
                          <div key={p.id} className="text-xs text-shopee-600 truncate">• {p.affiliate_url||p.shopee_url}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button onClick={()=>setStep(3)} className="btn-ghost">ย้อนกลับ</button>
            <button onClick={()=>setStep(5)} disabled={versions.length===0} className="btn-primary">
              ถัดไป <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 5 ─────────────────────────────── */}
      {step===5 && (
        <div className="card space-y-5 animate-slide-up">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Save className="w-5 h-5 text-shopee-600"/>ขั้นที่ 5: บันทึก
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {label:'URL ต้นฉบับ',value:sourceUrl?'✅':'—'},
              {label:'ภาษาไทย',value:translatedText?'✅':'—'},
              {label:'สินค้า',value:`${selectedProducts.length} รายการ`},
              {label:'เวอร์ชัน',value:`${versions.length} เวอร์ชัน`},
            ].map(s=>(
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {selectedVersion && (
            <div>
              <label className="label">ตัวอย่างเนื้อหา (เวอร์ชัน {selectedVersion.version_number})</label>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm whitespace-pre-wrap text-gray-700 max-h-48 overflow-y-auto">
                {insertLinks(selectedVersion.text)}
              </div>
            </div>
          )}

          {mediaUrls.length>0 && (
            <div>
              <label className="label">รูป/วิดีโอ ({mediaUrls.length} ไฟล์)</label>
              <p className="text-xs text-gray-500">ดาวน์โหลดรูป/วิดีโอจากขั้นที่ 1 แล้วแนบเองเมื่อโพสต์</p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button onClick={()=>setStep(4)} className="btn-ghost">ย้อนกลับ</button>
            <button onClick={()=>handleSave('draft')} disabled={saving} className="btn-secondary">
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}
              บันทึกแบบร่าง
            </button>
            <button onClick={()=>handleSave('pending')} disabled={saving} className="btn-primary">
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}
              บันทึก + รอดำเนินการ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Package
function Package({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
    </svg>
  );
}
