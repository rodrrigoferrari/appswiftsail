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
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString();
    const to = searchParams.get('to') || new Date().toISOString();

    const isAll = cliente_id.toUpperCase() === 'ALL';

    // 1. Verify active client
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

    // 2. Query Kommo leads (analytical, no PII)
    try {
      let leadsQuery = supabaseAdmin
        .schema('ads')
        .from('kommo_leads')
        .select('id, cliente_id, origem, utm_source, utm_medium, utm_campaign, campanha_nome, criado_em, pipeline_id, status_id, valor')
        .is('excluido_em', null)
        .gte('criado_em', from)
        .lte('criado_em', to);

      if (!isAll) {
        leadsQuery = leadsQuery.eq('cliente_id', cliente_id.toUpperCase());
      } else {
        leadsQuery = leadsQuery.in('cliente_id', activeClientIds);
      }

      const { data: leads, error: leadsErr } = await leadsQuery;
      if (leadsErr) throw new Error(leadsErr.message);

      // Aggregations by origin
      const origensMap: Record<string, number> = {};
      const campanhasMap: Record<string, number> = {};
      let valorTotal = 0;

      (leads || []).forEach((lead) => {
        const origem = lead.origem || lead.utm_source || '(sem origem)';
        origensMap[origem] = (origensMap[origem] || 0) + 1;

        if (lead.campanha_nome || lead.utm_campaign) {
          const camp = lead.campanha_nome || lead.utm_campaign || '';
          campanhasMap[camp] = (campanhasMap[camp] || 0) + 1;
        }

        if (lead.valor) {
          valorTotal += Number(lead.valor) || 0;
        }
      });

      const porOrigem = Object.entries(origensMap)
        .map(([origem, total]) => ({ origem, total }))
        .sort((a, b) => b.total - a.total);

      const porCampanha = Object.entries(campanhasMap)
        .map(([campanha, total]) => ({ campanha, total }))
        .sort((a, b) => b.total - a.total);

      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        total_leads: (leads || []).length,
        valor_total: valorTotal,
        por_origem: porOrigem,
        por_campanha: porCampanha,
      });
    } catch (dbErr: unknown) {
      console.warn('Fallback querying ads.kommo_* schema:', dbErr);
      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        total_leads: 0,
        valor_total: 0,
        por_origem: [],
        por_campanha: [],
        notice: 'Schema ads aguardando liberação de views no Postgres',
      });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
