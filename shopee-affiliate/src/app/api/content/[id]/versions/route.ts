import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { versions, product_ids } = await request.json();
  await supabase.from('content_versions').delete().eq('content_id', params.id);

  const inserts = versions.map((v: { version_number: number; text: string; word_count: number }) => ({
    content_id: params.id,
    version_number: v.version_number,
    text: v.text,
    word_count: v.word_count || 0,
    is_selected: v.version_number === 1,
  }));

  const { data, error } = await supabase.from('content_versions').insert(inserts).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (product_ids?.length) {
    await supabase.from('content_products').delete().eq('content_id', params.id);
    await supabase.from('content_products').insert(
      product_ids.map((pid: string) => ({ content_id: params.id, product_id: pid }))
    );
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { version_id } = await request.json();
  await supabase.from('content_versions').update({ is_selected: false }).eq('content_id', params.id);
  const { data, error } = await supabase.from('content_versions').update({ is_selected: true }).eq('id', version_id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
