import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = new URL(request.url).searchParams.get('type') || 'dashboard';

  if (type === 'dashboard') {
    const [contentRes, productRes, analyticsRes, schedulesRes, recentRes] = await Promise.all([
      supabase.from('content').select('status'),
      supabase.from('products').select('is_active'),
      supabase.from('analytics').select('event_type,revenue'),
      supabase.from('schedules').select(`*, content:content(id,title,platform,status)`)
        .gte('scheduled_at', new Date().toISOString()).eq('is_done', false).order('scheduled_at').limit(5),
      supabase.from('content').select('id,title,status,platform,created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const cs = contentRes.data || [];
    const ps = productRes.data || [];
    const as_ = analyticsRes.data || [];

    return NextResponse.json({
      content: {
        total: cs.length,
        draft: cs.filter(c=>c.status==='draft').length,
        pending: cs.filter(c=>c.status==='pending').length,
        scheduled: cs.filter(c=>c.status==='scheduled').length,
        published: cs.filter(c=>c.status==='published').length,
      },
      products: { total: ps.length, active: ps.filter(p=>p.is_active).length },
      analytics: {
        clicks: as_.filter(a=>a.event_type==='click').length,
        conversions: as_.filter(a=>a.event_type==='conversion').length,
        revenue: as_.reduce((s,a)=>s+(a.revenue||0), 0),
      },
      upcoming: schedulesRes.data || [],
      recent: recentRes.data || [],
    });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { data, error } = await supabase.from('analytics').insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.product_id && body.event_type === 'click') {
    await supabase.rpc('increment', { table_name: 'products', column_name: 'click_count', row_id: body.product_id });
  }
  return NextResponse.json({ data }, { status: 201 });
}
