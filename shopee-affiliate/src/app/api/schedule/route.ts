import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const upcoming = new URL(request.url).searchParams.get('upcoming') === 'true';
  let query = supabase.from('schedules')
    .select(`*, content:content(id,title,platform,status,content_versions(text,is_selected))`)
    .order('scheduled_at', { ascending: true });
  if (upcoming) query = query.gte('scheduled_at', new Date().toISOString()).eq('is_done', false);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { data, error } = await supabase.from('schedules').insert({ ...body, created_by: user.id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from('content').update({ status: 'scheduled', scheduled_at: body.scheduled_at }).eq('id', body.content_id);
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  const { data: s } = await supabase.from('schedules').select('content_id').eq('id', id).single();
  await supabase.from('schedules').delete().eq('id', id);
  if (s) await supabase.from('content').update({ status: 'pending', scheduled_at: null }).eq('id', s.content_id);
  return NextResponse.json({ success: true });
}
