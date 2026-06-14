import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
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
