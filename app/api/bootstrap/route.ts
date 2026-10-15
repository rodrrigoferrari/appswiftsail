import { NextResponse } from 'next/server';
import { getClientes, getContasAdsPainel, getCsStatusList, getKommoPipelinesResumo } from '@/lib/services/supabase-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [clientes, contasAds, csStatus, kommoPipelines] = await Promise.all([
      getClientes(),
      getContasAdsPainel(),
      getCsStatusList(),
      getKommoPipelinesResumo(),
    ]);

    return NextResponse.json({
      success: true,
      clientes,
      contasAds: contasAds || [],
      csStatus: csStatus || [],
      kommoPipelines: kommoPipelines || [],
    });
  } catch (error) {
    console.error('API bootstrap error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bootstrap data' },
      { status: 500 }
    );
  }
}
