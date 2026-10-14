import { NextRequest, NextResponse } from 'next/server';
import { UazapiClient } from '@/lib/uazapi';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cliente_id = 'swiftsail' } = body;

    const creds = await getUazapiCredentialsForClient(cliente_id);

    if (!creds.instanceToken) {
      return NextResponse.json({ success: false, error: 'Instância não encontrada' }, { status: 400 });
    }

    const uazapi = new UazapiClient(creds.instanceToken, creds.serverUrl);
    await uazapi.logoutInstance().catch(() => {});

    return NextResponse.json({
      success: true,
      status: 'disconnected',
      message: 'Instância desconectada com sucesso.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Erro ao desconectar' },
      { status: 500 }
    );
  }
}
