import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveClientesAtivos, fetchAll, indisponivel } from '@/lib/services/painel';
import { diasAtrasBRT, hojeBRT } from '@/lib/date';
import { CampanhaStatusPainel } from '@/types/database';

export const dynamic = 'force-dynamic';

interface MetaLinha {
  cliente_id: string;
  campaign_id: string;
  campanha: string | null;
  data: string;
  gasto: number | null;
  impressoes: number | null;
  cliques_link: number | null;
  leads: number | null;
  conversas_iniciadas: number | null;
}

export async function GET(request: Request, { params }: { params: Promise<{ cliente_id: string }> }) {
  try {
    const { cliente_id } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || diasAtrasBRT(29);
    const to = searchParams.get('to') || hojeBRT();

    const ids = await resolveClientesAtivos(cliente_id);
    if (ids === null) {
      return NextResponse.json({ success: false, error: 'Cliente inativo ou inexistente' }, { status: 404 });
    }

    const empty = { gasto: 0, leads: 0, conversas_iniciadas: 0, impressoes: 0, cliques: 0, ctr: 0, custo_por_lead: 0, custo_por_conversa: 0 };
    if (ids.length === 0) {
      return NextResponse.json({ success: true, cliente_id, periodo: { from, to }, totais: empty, campanhas: [] });
    }

    // 1. Carrega status e orçamentos atuais das campanhas de painel_campanhas_status
    const statusMap = new Map<string, CampanhaStatusPainel>();
    try {
      const statusRows = await fetchAll<CampanhaStatusPainel>((a, b) =>
        supabaseAdmin
          .from('painel_campanhas_status')
          .select('cliente_id,plataforma,campaign_id,campanha,status,effective_status,orcamento_diario')
          .eq('plataforma', 'meta')
          .in('cliente_id', ids)
          .range(a, b)
      );
      for (const s of statusRows) {
        statusMap.set(`${s.cliente_id}:${s.campaign_id}`, s);
        statusMap.set(s.campaign_id, s);
      }
    } catch {
      // Graceful fallback se a view não estiver disponível
    }

    // 2. View painel_meta_campanhas_dia já vem agregada anúncio -> campanha/dia, só de clientes ativos
    let rows: MetaLinha[];
    try {
      rows = await fetchAll<MetaLinha>((a, b) =>
        supabaseAdmin
          .from('painel_meta_campanhas_dia')
          .select('cliente_id,campaign_id,campanha,data,gasto,impressoes,cliques_link,leads,conversas_iniciadas')
          .in('cliente_id', ids)
          .gte('data', from)
          .lte('data', to)
          .order('data')
          .order('campaign_id')
          .range(a, b)
      );
    } catch (dbErr) {
      return NextResponse.json(indisponivel(dbErr), { status: 503 });
    }

    const porCampanha = new Map<string, any>();
    for (const r of rows) {
      const key = `${r.cliente_id}:${r.campaign_id}`;
      const c =
        porCampanha.get(key) ||
        { campaign_id: r.campaign_id, cliente_id: r.cliente_id, nome: r.campanha, gasto: 0, impressoes: 0, cliques: 0, leads: 0, conversas_iniciadas: 0 };
      c.gasto += Number(r.gasto) || 0;
      c.impressoes += Number(r.impressoes) || 0;
      c.cliques += Number(r.cliques_link) || 0;
      c.leads += Number(r.leads) || 0;
      c.conversas_iniciadas += Number(r.conversas_iniciadas) || 0;
      porCampanha.set(key, c);
    }

    const campanhas = Array.from(porCampanha.values())
      .map((c) => {
        const metaStatus = statusMap.get(`${c.cliente_id}:${c.campaign_id}`) || statusMap.get(c.campaign_id);
        return {
          ...c,
          status: metaStatus?.status || null,
          effective_status: metaStatus?.effective_status || null,
          orcamento_diario: metaStatus?.orcamento_diario ?? null,
          ctr: c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0,
          // Contrato: leads e conversas_iniciadas são eventos distintos — não somar
          custo_por_lead: c.leads > 0 ? Number((c.gasto / c.leads).toFixed(2)) : 0,
          custo_por_conversa: c.conversas_iniciadas > 0 ? Number((c.gasto / c.conversas_iniciadas).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.gasto - a.gasto);

    const t = campanhas.reduce(
      (acc, c) => ({
        gasto: acc.gasto + c.gasto,
        leads: acc.leads + c.leads,
        conversas_iniciadas: acc.conversas_iniciadas + c.conversas_iniciadas,
        impressoes: acc.impressoes + c.impressoes,
        cliques: acc.cliques + c.cliques,
      }),
      { gasto: 0, leads: 0, conversas_iniciadas: 0, impressoes: 0, cliques: 0 }
    );

    return NextResponse.json({
      success: true,
      cliente_id,
      periodo: { from, to },
      totais: {
        ...t,
        ctr: t.impressoes > 0 ? Number(((t.cliques / t.impressoes) * 100).toFixed(2)) : 0,
        custo_por_lead: t.leads > 0 ? Number((t.gasto / t.leads).toFixed(2)) : 0,
        custo_por_conversa: t.conversas_iniciadas > 0 ? Number((t.gasto / t.conversas_iniciadas).toFixed(2)) : 0,
      },
      campanhas,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}
