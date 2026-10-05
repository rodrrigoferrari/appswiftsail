import { NextResponse } from 'next/server';
import { getClientes, getGroupAdAccounts, getGroupAdMappings, getCsStatus, getContasAdsPainel } from '@/lib/services/supabase-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [clientes, adAccounts, mappings, csStatus, contasAds] = await Promise.all([
      getClientes(),
      getGroupAdAccounts(),
      getGroupAdMappings(),
      getCsStatus(),
      getContasAdsPainel(),
    ]);

    return NextResponse.json({
      success: true,
      clientes,
      adAccounts,
      mappings,
      csStatus,
      // null = painel ainda não acessível (o app usa o cadastro antigo como contingência)
      contasAds,
    });
  } catch (error) {
    console.error('API bootstrap error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bootstrap data' },
      { status: 500 }
    );
  }
}
