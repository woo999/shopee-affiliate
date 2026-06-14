# 🧵 Shopee TH Affiliate Platform

Threads URL → AI แปลภาษา → AI ปรับ 10 เวอร์ชัน → Shopee Affiliate Link อัตโนมัติ

## 🚀 วิธีตั้งค่า (5 ขั้นตอน)

### ขั้นที่ 1: Supabase
1. ไปที่ [supabase.com](https://supabase.com) → สร้าง Project ใหม่
2. ไปที่ SQL Editor → วาง `supabase-schema.sql` → Run
3. Settings → API → คัดลอก `URL` และ `anon public key`

### ขั้นที่ 2: OpenAI
1. ไปที่ [platform.openai.com](https://platform.openai.com)
2. API Keys → สร้าง Key ใหม่

### ขั้นที่ 3: สร้างไฟล์ .env.local
```bash
cp .env.local.example .env.local
# แก้ไขค่าใน .env.local
```

### ขั้นที่ 4: Deploy บน Vercel
1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → Import Repository
3. เพิ่ม Environment Variables ทั้งหมดจาก `.env.local`
4. Deploy!

### ขั้นที่ 5: ใช้งาน
1. สมัครสมาชิกที่ `/login`
2. เพิ่มสินค้าจาก Shopee Affiliate ที่ `/dashboard/products/new`
3. สร้างเนื้อหาใหม่ที่ `/dashboard/content/new`

## 🔄 Flow การใช้งาน
```
Threads URL → ดึงข้อความ → AI แปลไทย → เลือกสินค้า → AI สร้าง 10 เวอร์ชัน → บันทึก → ตั้งเวลา
```

## 📦 Tech Stack
- **Frontend**: Next.js 14, TailwindCSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Deploy**: Vercel

## 🔮 Phase 2 (เมื่อได้ Shopee API)
- ค้นหาสินค้าอัตโนมัติ
- สร้าง Affiliate Link อัตโนมัติ
- ติดตามยอดขาย Real-time
