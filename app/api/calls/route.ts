import { NextRequest, NextResponse } from 'next/server';
import { formatE164, normalizePhone } from '@/lib/phone';
import { UazapiClient } from '@/lib/uazapi';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';
import { saveCallRecord, updateCallRecord, listCalls } from '@/lib/services/kvh-storage';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clienteId = url.searchParams.get('cliente_id') || url.searchParams.get('workspace_id') || undefined;
    const calls = await listCalls(clienteId);

    return NextResponse.json({ success: true, calls }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      phone,
      contactName,
      leadId,
      contactId,
      cliente_id,
      apiKey,
      subdomain,
    } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Telefone de destino é obrigatório.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const rawDigits = normalizePhone(phone);
    if (rawDigits.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Número de telefone inválido.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const phoneE164 = formatE164(phone);
    const targetWorkspace = cliente_id || apiKey || subdomain || 'swiftsail';

    // 1. Obter credenciais UAZAPI da instância deste cliente
    const uazCreds = await getUazapiCredentialsForClient(targetWorkspace);

    const effectiveToken = body.instance_token || uazCreds.instanceToken;

    // 2. Salvar chamada com status "initiated"
    const call = await saveCallRecord({
      workspace_id: targetWorkspace,
      lead_id: leadId ? String(leadId) : null,
      contact_id: contactId ? String(contactId) : null,
      contact_name: contactName || 'Contato Lead',
      phone_e164: phoneE164,
      direction: 'outbound',
      status: 'initiated',
      duration_seconds: 0,
      started_at: new Date().toISOString(),
    });

    // 3. Se não tivermos linha conectada, avisar imediatamente
    if (!effectiveToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nenhuma linha WhatsApp conectada encontrada. Conecte pelo QR Code antes de efetuar a chamada.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Disparar chamada na UAZAPI (/call/make)
    let providerCallId: string | null = null;
    let uazResponseData: any = null;

    try {
      const uazapi = new UazapiClient(effectiveToken, uazCreds.serverUrl);
      const callRes = await uazapi.startVoiceCall(phoneE164);
      uazResponseData = callRes;

      if (callRes?.error || (callRes?.code && callRes.code >= 400)) {
        await updateCallRecord(call.id, { status: 'failed' });
        return NextResponse.json(
          {
            success: false,
            error: callRes.error || callRes.message || 'Linha WhatsApp não conseguiu completar a chamada.',
          },
          { status: 400, headers: corsHeaders }
        );
      }

      providerCallId = callRes?.call?.id || callRes?.id || callRes?.callId || callRes?.key?.id || callRes?.data?.id || null;
      if (providerCallId) {
        await updateCallRecord(call.id, { uazapi_call_id: providerCallId });
      }
    } catch (uazErr: any) {
      console.warn('[UAZAPI Voice Call Trigger Warning]:', uazErr.message);
      await updateCallRecord(call.id, { status: 'failed' });
      return NextResponse.json(
        {
          success: false,
          error: `Falha de conexão com a UAZAPI: ${uazErr.message}`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        call: {
          ...call,
          uazapi_call_id: providerCallId,
          status: 'dialing',
        },
        uazapi_call_id: providerCallId,
        message: 'Chamada WhatsApp iniciada com sucesso!',
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error('[Calls POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao iniciar chamada' },
      { status: 500, headers: corsHeaders }
    );
  }
}
