import { NextRequest, NextResponse } from 'next/server';
import { UazapiClient } from '@/lib/uazapi';
import { getUazapiCredentialsForClient } from '@/lib/services/credentials-resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clienteId = searchParams.get('cliente_id') || 'swiftsail';

    const creds = await getUazapiCredentialsForClient(clienteId);

    // Validação estrita de isolamento: instâncias master/notificações da agência nunca podem ser retornadas para clientes
    if (clienteId !== 'swiftsail') {
      const cleanInstName = (creds.instanceName || '').toLowerCase();
      if (cleanInstName.includes('notificac') || cleanInstName.includes('rodrigo pessoal')) {
        return NextResponse.json({
          connected: false,
          status: 'disconnected',
          hasInstance: false,
          message: 'Instância não conectada para este cliente.',
        });
      }
    }

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
