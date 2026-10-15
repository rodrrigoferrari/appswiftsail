import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  createClientInstance,
  deleteClientInstance,
  disconnectClientInstance,
  getInstanceStatus,
  connectInstance,
  listInstanceGroups,
  getGroupInfo,
  getChatDetails,
  sendTextMessage,
  setupInstanceWebhook,
} from '@/lib/services/uazapi';

export const dynamic = 'force-dynamic';

import { getUazapiCredentialsForClient, getAllUazapiInstances } from '@/lib/services/credentials-resolver';

// Helper to get or save client instance token in Supabase
async function getClientInstanceToken(clienteId: string): Promise<string | null> {
  const creds = await getUazapiCredentialsForClient(clienteId);
  if (creds.instanceToken) return creds.instanceToken;

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
    const { action, cliente_id, phone, group_jid, message, numbers, instance_token } = body;

    if (!cliente_id && action !== 'global_status' && action !== 'list_instances') {
      return NextResponse.json({ success: false, error: 'cliente_id é obrigatório.' }, { status: 400 });
    }

    switch (action) {
      // 0. LISTAR INSTÂNCIAS DA UAZAPI (COM ISOLAMENTO POR CLIENTE)
      case 'list_instances': {
        const allInstances = await getAllUazapiInstances();
        
        // Se for consulta do Admin global (swiftsail ou ALL sem restrição)
        if (!cliente_id || cliente_id === 'swiftsail' || cliente_id === 'ALL') {
          return NextResponse.json({ success: true, instances: allInstances });
        }

        // ISOLAMENTO DE CLIENTE: Busca a instância vinculada ao cliente na knowledge_base
        const { data: clientKb } = await supabaseAdmin
          .from('knowledge_base')
          .select('content')
          .contains('tags', ['uazapi_instance', cliente_id]);

        const clientTokens = new Set<string>();
        const clientNames = new Set<string>();

        if (clientKb && clientKb.length > 0) {
          for (const row of clientKb) {
            try {
              const parsed = JSON.parse(row.content);
              if (parsed.token) clientTokens.add(parsed.token);
              if (parsed.instance_name) clientNames.add(parsed.instance_name.toLowerCase());
            } catch {}
          }
        }

        const cleanTarget = cliente_id.toLowerCase().replace(/[^a-z0-9]/g, '');
        const clientKeywords = cliente_id
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((k: string) => k.length >= 3 && k !== 'incorporadora' && k !== 'ltda' && k !== 'construtora' && k !== 'grupo');

        // Filtra estritamente instâncias que pertençam a este cliente
        const clientInstances = allInstances.filter((inst: any) => {
          if (inst.token && clientTokens.has(inst.token)) return true;
          const instName = (inst.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if (clientNames.has((inst.name || '').toLowerCase())) return true;
          if (instName.includes(cleanTarget) || (cleanTarget.length > 4 && cleanTarget.includes(instName))) {
            return true;
          }
          if (clientKeywords.some((kw: string) => instName.includes(kw))) {
            return true;
          }
          return false;
        });

        return NextResponse.json({ success: true, instances: clientInstances });
      }

      // 1. CRIAR INSTÂNCIA DEDICADA PARA O CLIENTE VIA ADMIN TOKEN COM systemName app.swiftsail
      case 'create_instance': {
        const customName = body.instance_name ? body.instance_name.trim() : null;
        const instanceName = customName || `swiftsail-${cliente_id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const result = await createClientInstance(instanceName);

        if (result && (result.token || result.instance?.token)) {
          const actualToken = result.token || result.instance?.token;
          const payload = {
            cliente_id,
            instance_name: instanceName,
            token: actualToken,
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
            instance: result.instance || result,
            token: actualToken,
            name: instanceName,
            message: `Instância [${instanceName}] criada com sucesso vinculada a app.swiftsail.`,
          });
        }

        return NextResponse.json({ success: false, error: 'Falha ao obter token da nova instância.' });
      }

      // 1.1 EXCLUIR INSTÂNCIA DEFINITIVAMENTE (UAZAPI + BANCO)
      case 'delete_instance': {
        const instanceName = body.instance_name || `swiftsail-${cliente_id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        const targetToken = body.instance_token || instance_token;
        
        try {
          await deleteClientInstance(instanceName, targetToken);
        } catch (delErr: any) {
          console.error('[Uazapi Delete Instance Error]:', delErr?.message);
          return NextResponse.json({
            success: false,
            error: delErr?.message || 'Falha ao excluir instância na UAZAPI.',
          }, { status: 400 });
        }

        // Remove vínculo na knowledge_base
        try {
          if (cliente_id && cliente_id !== 'swiftsail') {
            await supabaseAdmin
              .from('knowledge_base')
              .delete()
              .contains('tags', ['uazapi_instance', cliente_id]);
          }

          if (targetToken) {
            await supabaseAdmin
              .from('knowledge_base')
              .delete()
              .contains('tags', ['uazapi_instance'])
              .ilike('content', `%${targetToken}%`);
          }
        } catch (kbErr) {
          console.warn('[KB Delete Warning]:', kbErr);
        }

        return NextResponse.json({
          success: true,
          message: `Instância [${instanceName}] excluída com sucesso da UAZAPI e do sistema.`,
        });
      }

      // 1.2 DESCONECTAR (LOGOUT) DA SESSÃO WHATSAPP
      case 'disconnect_instance': {
        const token = instance_token || (await getClientInstanceToken(cliente_id));
        if (!token) {
          return NextResponse.json({ success: false, error: 'Token da instância não encontrado para desconexão.' });
        }

        const discResult = await disconnectClientInstance(token);
        return NextResponse.json({
          success: true,
          result: discResult,
          message: 'Sessão WhatsApp desconectada com sucesso.',
        });
      }

      // 2. CONSULTAR STATUS DA INSTÂNCIA DO CLIENTE
      case 'status': {
        const token = instance_token || (await getClientInstanceToken(cliente_id));
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
        const token = instance_token || (await getClientInstanceToken(cliente_id));
        if (!token) {
          return NextResponse.json({ success: false, error: 'Instância não provisionada. Crie a instância primeiro.' });
        }

        const connectData = await connectInstance(token, phone);
        return NextResponse.json({
          success: true,
          connectData,
        });
      }

      // 4. LISTAR GRUPOS DA INSTÂNCIA COM NORMALIZAÇÃO TOTAL
      case 'list_groups': {
        const token = instance_token || (await getClientInstanceToken(cliente_id));
        if (!token) {
          return NextResponse.json({ success: false, error: 'Nenhuma instância configurada ou conectada.' });
        }

        const groupsData = await listInstanceGroups(token);
        const rawList = Array.isArray(groupsData) ? groupsData : groupsData?.groups || [];

        const normalizedGroups = rawList.map((g: any) => {
          const jid = g.JID || g.jid || g.id || '';
          const name = g.Name || g.name || g.subject || jid || 'Grupo sem nome';
          const pCount = Array.isArray(g.Participants)
            ? g.Participants.length
            : Array.isArray(g.participants)
            ? g.participants.length
            : g.ParticipantCount || g.participant_count || g.size || 0;

          return {
            id: jid,
            jid,
            name,
            subject: name,
            participantsCount: pCount,
            owner: g.OwnerPN || g.OwnerJID || g.owner || '',
            raw: g,
          };
        });

        return NextResponse.json({
          success: true,
          groups: normalizedGroups,
        });
      }

      // 5. EXTRAIR PARTICIPANTES DE UM GRUPO (SCRAPER)
      case 'scrape_group': {
        const token = instance_token || (await getClientInstanceToken(cliente_id));
        if (!token || !group_jid) {
          return NextResponse.json({ success: false, error: 'Token ou group_jid ausente.' });
        }

        const groupInfo = await getGroupInfo(token, group_jid);
        const rawParticipants = groupInfo.Participants || groupInfo.participants || [];

        // Enriquecer os participantes com /chat/details automaticamente
        const participants = await Promise.all(
          rawParticipants.map(async (p: any, idx: number) => {
            const rawPhone = p.PhoneNumber || p.phoneNumber || p.id?.user || p.id || p.phone || '';
            const cleanPhone = String(rawPhone).replace(/@.*$/, '').replace(/\D/g, '');
            const formattedPhone = cleanPhone ? (cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`) : '';
            const isAdmin = p.IsAdmin === true || p.IsSuperAdmin === true || p.admin === 'admin' || p.isAdmin === true;

            let name = p.DisplayName || p.Username || p.name || p.pushName || '';
            let image = '';
            let isBusiness = false;
            let businessName = '';

            // Consulta automática /chat/details para complementar informações do contato
            if (cleanPhone) {
              try {
                const details = await getChatDetails(token, cleanPhone);
                if (details) {
                  name =
                    details.name ||
                    details.wa_contactName ||
                    details.business_name ||
                    details.wa_name ||
                    name;
                  businessName = details.business_name || details.wa_name || '';
                  image = details.image || details.imagePreview || '';
                  isBusiness = Boolean(details.is_business);
                }
              } catch {
                // Mantém valores de fallback se falhar contato individual
              }
            }

            return {
              id: idx + 1,
              name: name || `Participante ${idx + 1}`,
              phone: formattedPhone,
              isAdmin,
              image,
              isBusiness,
              businessName,
              raw: p,
            };
          })
        );

        return NextResponse.json({
          success: true,
          group: groupInfo,
          participants,
        });
      }

      // 6. ENVIAR MENSAGEM / DISPARO
      case 'send_message': {
        const token = instance_token || (await getClientInstanceToken(cliente_id));
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
