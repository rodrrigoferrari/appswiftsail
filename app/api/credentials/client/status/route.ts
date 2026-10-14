import { NextRequest, NextResponse } from 'next/server';
import { getKommoCredentialsForClient } from '@/lib/services/credentials-resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id') || 'swiftsail';

    const creds = await getKommoCredentialsForClient(clienteId);

    if (creds && creds.accessToken) {
      return NextResponse.json({
        success: true,
        configured: true,
        subdomain: creds.baseDomain,
        pipelineId: creds.pipelineId || null,
        source: creds.source,
      });
    }

    return NextResponse.json({
      success: true,
      configured: false,
      message: 'Credenciais do Kommo CRM não configuradas para este cliente.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, configured: false, error: err.message }, { status: 500 });
  }
}
