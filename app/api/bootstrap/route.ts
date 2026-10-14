import { NextResponse } from 'next/server';
import { getClientes, getContasAdsPainel, getCsStatusList } from '@/lib/services/supabase-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [clientes, contasAds, csStatus] = await Promise.all([
      getClientes(),
      getContasAdsPainel(),
      getCsStatusList(),
    ]);

    return NextResponse.json({
      success: true,
      clientes,
      contasAds: contasAds || [],
      csStatus: csStatus || [],
    });
  } catch (error) {
    console.error('API bootstrap error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bootstrap data' },
      { status: 500 }
    );
  }
}
