import { NextResponse } from 'next/server';
import { getClientes, getGroupAdAccounts, getGroupAdMappings, getCsStatus } from '@/lib/services/supabase-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [clientes, adAccounts, mappings, csStatus] = await Promise.all([
      getClientes(),
      getGroupAdAccounts(),
      getGroupAdMappings(),
      getCsStatus(),
    ]);

    return NextResponse.json({
      success: true,
      clientes,
      adAccounts,
      mappings,
      csStatus,
    });
  } catch (error) {
    console.error('API bootstrap error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bootstrap data' },
      { status: 500 }
    );
  }
}
