import { NextRequest, NextResponse } from 'next/server';
import { UazapiClient } from '@/lib/uazapi';
import { encrypt } from '@/lib/crypto';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      cliente_id = 'swiftsail',
      phone,
      forceReconnect = false,
      serverUrl: customServerUrl,
      instanceName: customInstanceName,
      instanceToken: customToken,
    } = body;

    const baseCreds = await getUazapiCredentialsForClient(cliente_id);
    const serverUrl = customServerUrl || baseCreds.serverUrl || 'https://swiftsail.uazapi.com';
    const adminToken = baseCreds.adminToken || process.env.UAZAPI_ADMIN_TOKEN || '';

    let instanceToken = customToken || baseCreds.instanceToken || '';
    let instanceName = customInstanceName || baseCreds.instanceName || `swiftsail-${cliente_id}`;

    let targetPhone = (phone || '').replace(/\D/g, '');
    if ((targetPhone.length === 10 || targetPhone.length === 11) && !targetPhone.startsWith('55')) {
      targetPhone = '55' + targetPhone;
    }

    // 1. HIGHLANDER STRATEGY: Listar instâncias para evitar instâncias zumbis e conflito de portas
    if (adminToken && !instanceToken) {
      try {
        const listRes = await UazapiClient.listInstances(adminToken, serverUrl);
        const instances = Array.isArray(listRes) ? listRes : (listRes.instances || listRes.data || []);

        const candidates = [instanceName, `swiftsail-${cliente_id}`, targetPhone].filter(Boolean);
        const match = instances.find((i: any) => candidates.includes(i.name) || i.name?.includes(cliente_id));

        if (match) {
          instanceToken = match.token;
          instanceName = match.name;
        } else {
          const newInst = await UazapiClient.createInstance(adminToken, instanceName, serverUrl);
          instanceToken = newInst.instance?.token || newInst.token;
        }
      } catch (adminErr: any) {
        console.warn('[Highlander Instance List/Init Warning]:', adminErr.message);
      }
    }

    if (!instanceToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível obter ou criar a instância UAZAPI. Verifique se o Admin Token está configurado em Credenciais Master.',
        },
        { status: 400 }
      );
    }

    // 2. Salvar instância no knowledge_base com criptografia AES-256
    const payloadToPersist = {
      cliente_id,
      instance_name: instanceName,
      server_url: serverUrl,
      token: instanceToken,
      token_encrypted: encrypt(instanceToken),
      status: 'connecting',
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: existing } = await supabaseAdmin
        .from('knowledge_base')
        .select('id')
        .contains('tags', ['uazapi_instance', cliente_id])
        .limit(1);

      if (existing && existing.length > 0) {
        await supabaseAdmin
          .from('knowledge_base')
          .update({
            content: JSON.stringify(payloadToPersist),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
      } else {
        await supabaseAdmin.from('knowledge_base').insert({
          content: JSON.stringify(payloadToPersist),
          summary: `Instância UAZAPI - ${cliente_id}`,
          source: 'plataforma_admin',
          tags: ['uazapi_instance', cliente_id],
        });
      }
    } catch (saveErr) {
      console.warn('[Persist Instance Warning]:', saveErr);
    }

    const uazapi = new UazapiClient(instanceToken, serverUrl);

    // 3. Checar se já estava conectada (se forceReconnect não foi solicitado)
    if (!forceReconnect) {
      try {
        const statusRes = await uazapi.getInstanceStatus();
        const stateRaw = statusRes.instance?.status || statusRes.instance?.state || statusRes.status;
        const stateStr = typeof stateRaw === 'string' ? stateRaw.toLowerCase() : '';
        const isConnected = stateStr === 'connected' || stateStr === 'open' || statusRes.status?.connected === true;

        if (isConnected) {
          return NextResponse.json({
            success: true,
            status: 'connected',
            connected: true,
            instance: statusRes.instance,
            message: 'Instância já está conectada.',
          });
        }
      } catch {}
    }

    // Se estiver desconectada ou zumbi ou forceReconnect, desconectar antes de gerar novo pareamento
    try {
      await uazapi.logoutInstance();
      await new Promise((r) => setTimeout(r, 1500));
    } catch {}

    // 4. Solicitar Conexão (QR Code ou Pairing Code)
    const pairingPhone = targetPhone.length >= 10 ? targetPhone : undefined;
    const connectRes = await uazapi.connectInstance(pairingPhone);

    const qrcode =
      connectRes.instance?.qrcode ||
      connectRes.qrcode ||
      connectRes.base64 ||
      connectRes.qr ||
      null;

    const pairingCode =
      connectRes.instance?.paircode ||
      connectRes.paircode ||
      connectRes.pairingCode?.code ||
      connectRes.code ||
      null;

    return NextResponse.json({
      success: true,
      status: 'connecting',
      qrcode,
      pairingCode,
      instanceName,
      message: pairingCode ? 'Código de 8 dígitos gerado.' : 'QR Code gerado.',
    });
  } catch (err: any) {
    console.error('[WhatsApp Connect POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao conectar WhatsApp' },
      { status: 500 }
    );
  }
}
