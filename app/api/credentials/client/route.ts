import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { cliente_id, kommo_subdomain, kommo_token, kommo_pipeline_id } = await req.json();

    if (!cliente_id) {
      return NextResponse.json({ success: false, error: 'cliente_id é obrigatório' }, { status: 400 });
    }

    // Save client-specific CRM credentials in knowledge_base or client metadata
    const { data: existing } = await supabaseAdmin
      .from('knowledge_base')
      .select('id')
      .contains('tags', ['client_credentials', cliente_id])
      .limit(1);

    const payload = {
      cliente_id,
      kommo_subdomain,
      kommo_token,
      kommo_pipeline_id,
      updated_at: new Date().toISOString(),
    };

    if (existing && existing.length > 0) {
      await supabaseAdmin
        .from('knowledge_base')
        .update({
          content: JSON.stringify(payload),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);
    } else {
      await supabaseAdmin.from('knowledge_base').insert({
        content: JSON.stringify(payload),
        summary: `Credenciais Kommo CRM - Cliente ${cliente_id}`,
        source: 'plataforma_admin',
        tags: ['client_credentials', cliente_id],
      });
    }

    return NextResponse.json({
      success: true,
      message: `Credenciais Kommo CRM do cliente [${cliente_id}] salvas com sucesso no Supabase.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
