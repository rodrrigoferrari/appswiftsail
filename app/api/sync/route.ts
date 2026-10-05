import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let syncData = [];
    try {
      const { data, error } = await supabaseAdmin
        .schema('ads')
        .from('sync_rodadas')
        .select('*')
        .order('iniciado_em', { ascending: false })
        .limit(20);

      if (!error && data) {
        syncData = data;
      }
    } catch {
      // Fallback if schema ads query is restricted
    }

    return NextResponse.json({
      success: true,
      sync_rodadas: syncData,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro ao buscar sync' },
      { status: 500 }
    );
  }
}
