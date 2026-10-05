import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cliente_id: string }> }
) {
  try {
    const { cliente_id } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const isAll = cliente_id.toUpperCase() === 'ALL';

    // 1. Verify that the requested client is active (or get all active clients)
    let activeClientIds: string[] = [];
    if (isAll) {
      const { data: clients } = await supabaseAdmin
        .from('clientes')
        .select('cliente_id')
        .eq('status', 'ativo');
      activeClientIds = (clients || []).map((c) => c.cliente_id);
    } else {
      const { data: client } = await supabaseAdmin
        .from('clientes')
        .select('cliente_id, status')
        .eq('cliente_id', cliente_id.toUpperCase())
        .single();

      if (!client || client.status !== 'ativo') {
        return NextResponse.json(
          { success: false, error: 'Cliente inativo ou inexistente' },
          { status: 404 }
        );
      }
      activeClientIds = [client.cliente_id];
    }

    // 2. Fetch Google Ads Campaigns and Results
    // Query ads.google_campanhas and ads.google_resultado_dia via supabaseAdmin
    try {
      let campaignsQuery = supabaseAdmin
        .schema('ads')
        .from('google_campanhas')
        .select('*')
        .is('excluido_em', null);

      let resultsQuery = supabaseAdmin
        .schema('ads')
        .from('google_resultado_dia')
        .select('*')
        .gte('data', from)
        .lte('data', to);

      if (!isAll) {
        campaignsQuery = campaignsQuery.eq('cliente_id', cliente_id.toUpperCase());
        resultsQuery = resultsQuery.eq('cliente_id', cliente_id.toUpperCase());
      } else {
        campaignsQuery = campaignsQuery.in('cliente_id', activeClientIds);
        resultsQuery = resultsQuery.in('cliente_id', activeClientIds);
      }

      const [{ data: campaigns, error: campErr }, { data: results, error: resErr }] =
        await Promise.all([campaignsQuery, resultsQuery]);

      if (campErr || resErr) {
        throw new Error(campErr?.message || resErr?.message);
      }

      // Group and aggregate results by campaign
      const aggregatedCampaigns = (campaigns || []).map((camp) => {
        const campResults = (results || []).filter((r) => r.campaign_id === camp.campaign_id);
        const gasto = campResults.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
        const impressoes = campResults.reduce((acc, curr) => acc + (Number(curr.impressoes) || 0), 0);
        const cliques = campResults.reduce((acc, curr) => acc + (Number(curr.cliques) || 0), 0);
        const conversoes = campResults.reduce((acc, curr) => acc + (Number(curr.conversoes) || 0), 0);
        const valorConversoes = campResults.reduce((acc, curr) => acc + (Number(curr.valor_conversoes) || 0), 0);
        const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
        const cpc = cliques > 0 ? gasto / cliques : 0;

        return {
          campaign_id: camp.campaign_id,
          customer_id: camp.customer_id,
          nome: camp.nome,
          cliente_id: camp.cliente_id,
          tipo: camp.tipo,
          status: camp.status,
          orcamento_diario: camp.orcamento_diario,
          gasto,
          impressoes,
          cliques,
          conversoes,
          valor_conversoes: valorConversoes,
          ctr: Number(ctr.toFixed(2)),
          cpc: Number(cpc.toFixed(2)),
        };
      });

      const totalGasto = aggregatedCampaigns.reduce((acc, c) => acc + c.gasto, 0);
      const totalCliques = aggregatedCampaigns.reduce((acc, c) => acc + c.cliques, 0);
      const totalImpressoes = aggregatedCampaigns.reduce((acc, c) => acc + c.impressoes, 0);
      const totalConversoes = aggregatedCampaigns.reduce((acc, c) => acc + c.conversoes, 0);
      const totalValorConversoes = aggregatedCampaigns.reduce((acc, c) => acc + c.valor_conversoes, 0);

      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        totais: {
          gasto: totalGasto,
          cliques: totalCliques,
          impressoes: totalImpressoes,
          conversoes: totalConversoes,
          valor_conversoes: totalValorConversoes,
          ctr: totalImpressoes > 0 ? Number(((totalCliques / totalImpressoes) * 100).toFixed(2)) : 0,
          cpc: totalCliques > 0 ? Number((totalGasto / totalCliques).toFixed(2)) : 0,
        },
        campanhas: aggregatedCampaigns,
      });
    } catch (dbErr: unknown) {
      console.warn('Fallback / notice querying ads.google_* schema:', dbErr);
      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        notice: 'Schema ads aguardando liberação de views no Postgres',
        totais: { gasto: 0, cliques: 0, impressoes: 0, conversoes: 0, valor_conversoes: 0, ctr: 0, cpc: 0 },
        campanhas: [],
      });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
