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

    // 2. Fetch Meta Ads Campaigns and Results
    // Query ads.meta_campanhas and ads.meta_resultado_anuncio_dia via supabaseAdmin
    try {
      let campaignsQuery = supabaseAdmin
        .schema('ads')
        .from('meta_campanhas')
        .select('*')
        .is('excluido_em', null);

      let resultsQuery = supabaseAdmin
        .schema('ads')
        .from('meta_resultado_anuncio_dia')
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
        const cliques = campResults.reduce((acc, curr) => acc + (Number(curr.cliques_link || curr.cliques) || 0), 0);
        const leads = campResults.reduce((acc, curr) => acc + (Number(curr.leads || curr.conversas_iniciadas) || 0), 0);
        const ctr = impressoes > 0 ? (cliques / impressoes) * 100 : 0;
        const cpa = leads > 0 ? gasto / leads : 0;

        return {
          campaign_id: camp.campaign_id,
          nome: camp.nome,
          cliente_id: camp.cliente_id,
          status: camp.status,
          effective_status: camp.effective_status,
          gasto,
          impressoes,
          cliques,
          leads,
          ctr: Number(ctr.toFixed(2)),
          cpa: Number(cpa.toFixed(2)),
        };
      });

      const totalGasto = aggregatedCampaigns.reduce((acc, c) => acc + c.gasto, 0);
      const totalLeads = aggregatedCampaigns.reduce((acc, c) => acc + c.leads, 0);
      const totalImpressoes = aggregatedCampaigns.reduce((acc, c) => acc + c.impressoes, 0);
      const totalCliques = aggregatedCampaigns.reduce((acc, c) => acc + c.cliques, 0);

      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        totais: {
          gasto: totalGasto,
          leads: totalLeads,
          impressoes: totalImpressoes,
          cliques: totalCliques,
          ctr: totalImpressoes > 0 ? Number(((totalCliques / totalImpressoes) * 100).toFixed(2)) : 0,
          cpa: totalLeads > 0 ? Number((totalGasto / totalLeads).toFixed(2)) : 0,
        },
        campanhas: aggregatedCampaigns,
      });
    } catch (dbErr: unknown) {
      console.warn('Fallback / notice querying ads.meta_* schema:', dbErr);
      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        notice: 'Schema ads aguardando liberação de views no Postgres',
        totais: { gasto: 0, leads: 0, impressoes: 0, cliques: 0, ctr: 0, cpa: 0 },
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
