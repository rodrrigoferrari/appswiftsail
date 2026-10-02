import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .contains('tags', ['admin', 'credentials'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching credentials:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let credentials = {};
    if (data && data.length > 0) {
      try {
        credentials = JSON.parse(data[0].content);
      } catch (e) {
        console.error('Failed to parse credentials content', e);
      }
    }

    return NextResponse.json({
      success: true,
      credentials: {
        uazapi_url: 'https://api.uazapi.com',
        uazapi_token: '',
        uazapi_instance: 'inst_swiftsail_live',
        meta_bm_id: '791208745012339',
        meta_access_token: '',
        meta_app_secret: '',
        google_mcc_id: '262-638-1700',
        google_developer_token: '',
        google_client_id: '',
        google_client_secret: '',
        google_refresh_token: '',
        kommo_subdomain: 'swiftsail',
        kommo_token: '',
        asaas_api_key: '',
        asaas_environment: 'production',
        openrouter_api_key: '',
        ai_default_model: 'deepseek/deepseek-v4-pro',
        ...credentials,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credentials } = body;

    if (!credentials) {
      return NextResponse.json({ success: false, error: 'No credentials payload provided' }, { status: 400 });
    }

    // Check if an existing entry exists to update or insert
    const { data: existing } = await supabaseAdmin
      .from('knowledge_base')
      .select('id')
      .contains('tags', ['admin', 'credentials'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      const { error } = await supabaseAdmin
        .from('knowledge_base')
        .update({
          content: JSON.stringify(credentials),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id);

      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('knowledge_base')
        .insert({
          content: JSON.stringify(credentials),
          summary: 'Credenciais Master e Configurações de Integração Swiftsail',
          source: 'plataforma_admin',
          tags: ['admin', 'credentials', 'config'],
        });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Credenciais salvas com sucesso no Supabase.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
