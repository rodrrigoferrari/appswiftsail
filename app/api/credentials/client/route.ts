import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id');

    if (!clienteId || clienteId === 'ALL') {
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .contains('tags', ['client_credentials']);

      if (error) throw error;

      const credentialsList = (data || []).map((row) => {
        try {
          return JSON.parse(row.content);
        } catch {
          return null;
        }
      }).filter(Boolean);

      return NextResponse.json({ success: true, credentials: credentialsList });
    }

    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .contains('tags', ['client_credentials', clienteId])
      .limit(1);

    if (error) throw error;

    let creds = null;
    if (data && data.length > 0) {
      try {
        creds = JSON.parse(data[0].content);
      } catch {}
    }

    return NextResponse.json({ success: true, credentials: creds });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

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
