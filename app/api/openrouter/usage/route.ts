import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get('key');

    // Se a chave não foi passada na query, busca no knowledge_base master
    if (!key) {
      const { data } = await supabaseAdmin
        .from('knowledge_base')
        .select('content')
        .contains('tags', ['admin', 'credentials'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        try {
          const parsed = JSON.parse(data[0].content);
          key = parsed.openrouter_api_key || null;
        } catch {}
      }
    }

    if (!key && process.env.OPENROUTER_API_KEY) {
      key = process.env.OPENROUTER_API_KEY;
    }

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma chave da OpenRouter cadastrada.',
      });
    }

    const startTime = Date.now();
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });

    const latency = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        success: false,
        error: `Falha ao validar chave OpenRouter (${res.status}): ${errText}`,
        latency,
      });
    }

    const data = await res.json();
    return NextResponse.json({
      success: true,
      data: data.data || data,
      latency,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
