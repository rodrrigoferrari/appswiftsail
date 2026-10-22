import { NextRequest, NextResponse } from 'next/server';
import { UazapiClient } from '@/lib/uazapi';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id') || 'swiftsail';
    const queryToken = searchParams.get('instance_token');
    const queryName = searchParams.get('instance_name');

    const creds = await getUazapiCredentialsForClient(clienteId);

    // Token e nome efetivos (prioriza creds resolvidas, com fallback no queryToken se válido)
    let effectiveToken = creds.instanceToken || queryToken || '';
    let effectiveName = creds.instanceName || queryName || `swiftsail-${clienteId}`;

    // Validação estrita de isolamento: instâncias master/notificações da agência nunca podem ser retornadas para clientes
    if (clienteId !== 'swiftsail') {
      const cleanInstName = (effectiveName || '').toLowerCase();
      if (cleanInstName.includes('notificac') || cleanInstName.includes('rodrigo pessoal')) {
        return NextResponse.json({
          connected: false,
          status: 'disconnected',
          hasInstance: false,
          message: 'Instância não conectada para este cliente.',
        });
      }
    }

    if (!effectiveToken) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        hasInstance: false,
        message: 'Nenhuma instância encontrada para este cliente.',
      });
    }

    const uazapi = new UazapiClient(effectiveToken, creds.serverUrl);
    const response = await uazapi.getInstanceStatus().catch((err: any) => {
      return { error: err.message };
    });

    if (response.error) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        hasInstance: true,
        error: response.error,
      });
    }

    // Regra de Ouro: Checagem rigorosa de tipos e status da UAZAPI/Baileys
    const rawStatus = response.instance?.status ?? response.instance?.state ?? response.status ?? response.state ?? '';
    const stateStr = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';

    const isExplicitlyDisconnected =
      stateStr === 'disconnected' ||
      stateStr === 'close' ||
      response.status?.connected === false ||
      response.instance?.connected === false;

    const isConnected =
      !isExplicitlyDisconnected &&
      (stateStr === 'connected' ||
        stateStr === 'open' ||
        response.status?.connected === true ||
        response.instance?.connected === true);

    const finalStatus = isConnected
      ? 'connected'
      : stateStr === 'connecting' || stateStr === 'pairing'
      ? 'connecting'
      : 'disconnected';

    const owner = response.owner || response.instance?.owner || '';
    const profileName = response.profileName || response.instance?.profileName || '';
    const profilePicUrl = response.profilePicUrl || response.instance?.profilePicUrl || '';

    // Sincronização automática em background no Supabase (knowledge_base)
    if (isConnected && clienteId) {
      (async () => {
        try {
          const { data: existingRows } = await supabaseAdmin
            .from('knowledge_base')
            .select('id, content')
            .contains('tags', ['uazapi_instance', clienteId])
            .limit(1);

          if (existingRows && existingRows.length > 0) {
            let rowContent: any = {};
            try { rowContent = JSON.parse(existingRows[0].content); } catch {}
            if (rowContent.status !== 'connected' || rowContent.owner !== owner) {
              rowContent.status = 'connected';
              if (owner) rowContent.owner = owner;
              if (profileName) rowContent.profileName = profileName;
              if (profilePicUrl) rowContent.profilePicUrl = profilePicUrl;
              rowContent.updated_at = new Date().toISOString();

              await supabaseAdmin
                .from('knowledge_base')
                .update({
                  content: JSON.stringify(rowContent),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingRows[0].id);
            }
          }
        } catch (syncErr) {
          console.warn('[Auto Sync Supabase Warning]:', syncErr);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      connected: isConnected,
      status: finalStatus,
      instanceName: effectiveName,
      serverUrl: creds.serverUrl,
      instance: response.instance || {
        name: effectiveName,
        profileName,
        owner,
        profilePicUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, status: 'disconnected', error: err.message },
      { status: 500 }
    );
  }
}
