import { NextRequest, NextResponse } from 'next/server';
import { UazapiClient } from '@/lib/uazapi';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';
import { getCallRecord, updateCallRecord } from '@/lib/services/kvh-storage';

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

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da chamada ausente' }, { status: 400, headers: corsHeaders });
    }

    const call = await getCallRecord(id);
    const now = new Date();
    let durationSeconds = 0;

    if (call?.started_at) {
      const started = new Date(call.started_at);
      durationSeconds = Math.max(0, Math.round((now.getTime() - started.getTime()) / 1000));
    }

    // Encerrar na UAZAPI via /call/reject
    const targetWorkspace = call?.workspace_id || 'swiftsail';
    const uazCreds = await getUazapiCredentialsForClient(targetWorkspace);

    let uazResult: any = null;
    if (uazCreds.instanceToken) {
      try {
        const uazapi = new UazapiClient(uazCreds.instanceToken, uazCreds.serverUrl);
        uazResult = await uazapi.rejectCall(call?.uazapi_call_id || id);
      } catch (uazErr: any) {
        console.warn('[UAZAPI Hangup Warning]:', uazErr.message);
      }
    }

    // Atualizar no banco / storage
    const updated = await updateCallRecord(id, {
      status: 'ended',
      ended_at: now.toISOString(),
      duration_seconds: durationSeconds,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Chamada encerrada com sucesso',
        durationSeconds,
        call: updated,
        uazResult,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: any) {
    console.error('[Hangup Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao desligar chamada' },
      { status: 500, headers: corsHeaders }
    );
  }
}
