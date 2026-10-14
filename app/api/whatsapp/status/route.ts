import { NextRequest, NextResponse } from 'next/server';
import { UazapiClient } from '@/lib/uazapi';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id') || 'swiftsail';

    const creds = await getUazapiCredentialsForClient(clienteId);

    if (!creds.instanceToken) {
      return NextResponse.json({
        connected: false,
        status: 'disconnected',
        hasInstance: false,
        message: 'Nenhuma instância encontrada para este cliente.',
      });
    }

    const uazapi = new UazapiClient(creds.instanceToken, creds.serverUrl);
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

    // Regra de Ouro: Checagem segura de tipos para evitar quebra com objetos no campo status
    const rawStatus = response.instance?.status ?? response.instance?.state ?? response.status ?? response.state ?? '';
    const stateStr = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';

    const isConnected =
      stateStr === 'connected' ||
      stateStr === 'open' ||
      response.status?.connected === true ||
      response.status?.loggedIn === true ||
      response.loggedIn === true ||
      response.instance?.connected === true;

    const finalStatus = isConnected
      ? 'connected'
      : stateStr === 'connecting' || stateStr === 'pairing'
      ? 'connecting'
      : 'disconnected';

    return NextResponse.json({
      success: true,
      connected: isConnected,
      status: finalStatus,
      instanceName: creds.instanceName,
      serverUrl: creds.serverUrl,
      instance: response.instance || {
        name: creds.instanceName,
        profileName: response.profileName || response.instance?.profileName,
        owner: response.owner || response.instance?.owner,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { connected: false, status: 'disconnected', error: err.message },
      { status: 500 }
    );
  }
}
