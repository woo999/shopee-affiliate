import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // ── TRANSLATE ──────────────────────────────
    if (action === 'translate') {
      const { text } = body;
      if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `คุณเป็นนักแปลมืออาชีพ แปลข้อความเป็นภาษาไทยสำหรับโซเชียลมีเดีย
กฎ: ใช้ภาษาไทยที่เป็นธรรมชาติ เข้าใจง่าย เหมาะกับ Threads/Instagram
อย่าแปลชื่อแบรนด์ ตอบเฉพาะข้อความที่แปลแล้วเท่านั้น ไม่ต้องอธิบาย`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return NextResponse.json({ translated_text: res.choices[0].message.content?.trim() || '' });
    }

    // ── GENERATE VERSIONS ──────────────────────
    if (action === 'generate_versions') {
      const { source_text, translated_text, product_names, category, count = 10 } = body;
      const baseText = translated_text || source_text;
      if (!baseText) return NextResponse.json({ error: 'text required' }, { status: 400 });

      const categoryContext: Record<string,string> = {
        baby: 'สินค้าสำหรับเด็กทารกและคุณแม่',
        pet: 'สินค้าสำหรับสัตว์เลี้ยง หมาและแมว',
        beauty: 'สินค้าความงามและสกินแคร์',
        other: 'สินค้าทั่วไป',
      };
      const catCtx = categoryContext[category] || 'สินค้าทั่วไป';
      const productList = product_names?.length ? `\nสินค้า: ${product_names.join(', ')}` : '';

      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `คุณเป็น Content Creator มืออาชีพสำหรับ Shopee Affiliate บน Threads ไทย
หมวดสินค้า: ${catCtx}${productList}

สร้าง ${count} โพสต์ที่แตกต่างกัน:
- แต่ละโพสต์มีสไตล์ต่าง (สนุก/ซีเรียส/รีวิว/เพื่อนบอกเพื่อน/ผู้เชี่ยวชาญ/เล่าเรื่อง ฯลฯ)
- ภาษาไทยธรรมชาติ เหมาะกับ Threads
- ใส่ Emoji ที่เหมาะสม
- 50-150 คำ
- ใส่ [LINK] ตรงที่ควรใส่ลิงก์สินค้า
- ห้ามซ้ำกัน

ตอบเป็น JSON เท่านั้น:
{"versions":[{"version_number":1,"style":"ชื่อสไตล์","text":"เนื้อหา..."},...]}`
          },
          { role: 'user', content: `ต้นฉบับ:\n${baseText}` }
        ],
        temperature: 0.92,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
      });

      let parsed: { versions?: { version_number: number; style?: string; text: string }[] } = { versions: [] };
      try { parsed = JSON.parse(res.choices[0].message.content || '{}'); } catch { /* ignore */ }

      const versions = (parsed.versions || []).map((v, i) => ({
        version_number: v.version_number || i + 1,
        style: v.style || '',
        text: v.text || '',
        word_count: (v.text || '').split(/\s+/).filter(Boolean).length,
      }));

      return NextResponse.json({ versions });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (err) {
    console.error('AI error:', err);
    if (err instanceof OpenAI.APIError) return NextResponse.json({ error: err.message }, { status: 500 });
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}
