import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  createClientInstance,
  getInstanceStatus,
  connectInstance,
  listInstanceGroups,
  getGroupInfo,
  sendTextMessage,
  setupInstanceWebhook,
} from '@/lib/services/uazapi';

export const dynamic = 'force-dynamic';

// Helper to get or save client instance token in Supabase
async function getClientInstanceToken(clienteId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('knowledge_base')
    .select('content')
    .contains('tags', ['uazapi_instance', clienteId])
    .limit(1);

  if (data && data.length > 0) {
    try {
      const parsed = JSON.parse(data[0].content);
      return parsed.token || null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, cliente_id, phone, group_jid, message, numbers } = body;

    if (!cliente_id && action !== 'global_status') {
      return NextResponse.json({ success: false, error: 'cliente_id é obrigatório.' }, { status: 400 });
    }

    switch (action) {
      // 1. CRIAR INSTÂNCIA DEDICADA PARA O CLIENTE VIA ADMIN TOKEN
      case 'create_instance': {
        const instanceName = `swiftsail-${cliente_id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const result = await createClientInstance(instanceName);

        if (result && result.token) {
          // Persist client instance in Supabase
          const payload = {
            cliente_id,
            instance_name: instanceName,
            token: result.token,
            created_at: new Date().toISOString(),
          };

          const { data: existing } = await supabaseAdmin
            .from('knowledge_base')
            .select('id')
            .contains('tags', ['uazapi_instance', cliente_id])
            .limit(1);

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
              summary: `Instância Uazapi Cliente - ${cliente_id}`,
              source: 'plataforma_admin',
              tags: ['uazapi_instance', cliente_id],
            });
          }

          return NextResponse.json({
            success: true,
            instance: result,
            message: `Instância [${instanceName}] criada com sucesso via Admin Token.`,
          });
        }

        return NextResponse.json({ success: false, error: 'Falha ao obter token da nova instância.' });
      }

      // 2. CONSULTAR STATUS DA INSTÂNCIA DO CLIENTE
      case 'status': {
        const token = await getClientInstanceToken(cliente_id);
        if (!token) {
          return NextResponse.json({
            success: true,
            has_instance: false,
            status: 'unprovisioned',
            message: 'Instância ainda não criada para este cliente.',
          });
        }

        const statusData = await getInstanceStatus(token);
        return NextResponse.json({
          success: true,
          has_instance: true,
          status: statusData.status || statusData.state || 'disconnected',
          details: statusData,
        });
      }

      // 3. INICIAR CONEXÃO / OBTER QR CODE
      case 'connect': {
        const token = await getClientInstanceToken(cliente_id);
        if (!token) {
          return NextResponse.json({ success: false, error: 'Instância não provisionada. Crie a instância primeiro.' });
        }

        const connectData = await connectInstance(token, phone);
        return NextResponse.json({
          success: true,
          connectData,
        });
      }

      // 4. LISTAR GRUPOS DA INSTÂNCIA
      case 'list_groups': {
        const token = await getClientInstanceToken(cliente_id);
        if (!token) {
          return NextResponse.json({ success: false, error: 'Instância não configurada.' });
        }

        const groupsData = await listInstanceGroups(token);
        return NextResponse.json({
          success: true,
          groups: groupsData.groups || groupsData || [],
        });
      }

      // 5. EXTRAIR PARTICIPANTES DE UM GRUPO (SCRAPER)
      case 'scrape_group': {
        const token = await getClientInstanceToken(cliente_id);
        if (!token || !group_jid) {
          return NextResponse.json({ success: false, error: 'Token ou group_jid ausente.' });
        }

        const groupInfo = await getGroupInfo(token, group_jid);
        return NextResponse.json({
          success: true,
          group: groupInfo,
        });
      }

      // 6. ENVIAR MENSAGEM / DISPARO
      case 'send_message': {
        const token = await getClientInstanceToken(cliente_id);
        if (!token) {
          return NextResponse.json({ success: false, error: 'Instância não conectada.' });
        }

        const result = await sendTextMessage(token, phone, message, true);
        return NextResponse.json({
          success: true,
          result,
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Ação desconhecida.' }, { status: 400 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
