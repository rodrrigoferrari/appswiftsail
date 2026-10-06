import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveClientesAtivos, fetchAll, indisponivel } from '@/lib/services/painel';
import { diasAtrasBRT, hojeBRT } from '@/lib/date';
import { CampanhaStatusPainel } from '@/types/database';

export const dynamic = 'force-dynamic';

interface GoogleLinha {
  cliente_id: string;
  campaign_id: string;
  campanha: string | null;
  data: string;
  gasto: number | null;
  impressoes: number | null;
  cliques: number | null;
  conversoes: number | null;
  valor_conversoes: number | null;
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

    const empty = { gasto: 0, cliques: 0, impressoes: 0, conversoes: 0, valor_conversoes: 0, ctr: 0, cpc: 0, custo_por_conversao: 0 };
    if (ids.length === 0) {
      return NextResponse.json({ success: true, cliente_id, periodo: { from, to }, totais: empty, campanhas: [] });
    }

    // 1. Carrega status e orçamento diário atual de painel_campanhas_status (em reais)
    const statusMap = new Map<string, CampanhaStatusPainel>();
    try {
      const statusRows = await fetchAll<CampanhaStatusPainel>((a, b) =>
        supabaseAdmin
          .from('painel_campanhas_status')
          .select('cliente_id,plataforma,campaign_id,campanha,status,effective_status,orcamento_diario')
          .eq('plataforma', 'google')
          .in('cliente_id', ids)
          .range(a, b)
      );
      for (const s of statusRows) {
        statusMap.set(`${s.cliente_id}:${s.campaign_id}`, s);
        statusMap.set(s.campaign_id, s);
      }
    } catch {
      // Graceful fallback
    }

    // 2. View painel_google_campanhas_dia expõe somente nivel='campanha' (evita duplicar gasto com grupo/anuncio/palavra)
    let rows: GoogleLinha[];
    try {
      rows = await fetchAll<GoogleLinha>((a, b) =>
        supabaseAdmin
          .from('painel_google_campanhas_dia')
          .select('cliente_id,campaign_id,campanha,data,gasto,impressoes,cliques,conversoes,valor_conversoes')
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
        { campaign_id: r.campaign_id, cliente_id: r.cliente_id, nome: r.campanha, gasto: 0, impressoes: 0, cliques: 0, conversoes: 0, valor_conversoes: 0 };
      c.gasto += Number(r.gasto) || 0;
      c.impressoes += Number(r.impressoes) || 0;
      c.cliques += Number(r.cliques) || 0;
      c.conversoes += Number(r.conversoes) || 0;
      c.valor_conversoes += Number(r.valor_conversoes) || 0;
      porCampanha.set(key, c);
    }

    // Só retorna campanhas que efetivamente rodaram no período (gasto, impressões, cliques ou conversões > 0)
    const campanhas = Array.from(porCampanha.values())
      .filter(
        (c) =>
          Number(c.gasto || 0) > 0 ||
          Number(c.impressoes || 0) > 0 ||
          Number(c.cliques || 0) > 0 ||
          Number(c.conversoes || 0) > 0
      )
      .map((c) => {
        const googleStatus = statusMap.get(`${c.cliente_id}:${c.campaign_id}`) || statusMap.get(c.campaign_id);
        return {
          ...c,
          status: googleStatus?.status || null,
          effective_status: googleStatus?.effective_status || null,
          orcamento_diario: googleStatus?.orcamento_diario ?? null,
          ctr: c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0,
          cpc: c.cliques > 0 ? Number((c.gasto / c.cliques).toFixed(2)) : 0,
          custo_por_conversao: c.conversoes > 0 ? Number((c.gasto / c.conversoes).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.gasto - a.gasto);

    const t = campanhas.reduce(
      (acc, c) => ({
        gasto: acc.gasto + c.gasto,
        cliques: acc.cliques + c.cliques,
        impressoes: acc.impressoes + c.impressoes,
        conversoes: acc.conversoes + c.conversoes,
        valor_conversoes: acc.valor_conversoes + c.valor_conversoes,
      }),
      { gasto: 0, cliques: 0, impressoes: 0, conversoes: 0, valor_conversoes: 0 }
    );

    return NextResponse.json({
      success: true,
      cliente_id,
      periodo: { from, to },
      totais: {
        ...t,
        ctr: t.impressoes > 0 ? Number(((t.cliques / t.impressoes) * 100).toFixed(2)) : 0,
        cpc: t.cliques > 0 ? Number((t.gasto / t.cliques).toFixed(2)) : 0,
        custo_por_conversao: t.conversoes > 0 ? Number((t.gasto / t.conversoes).toFixed(2)) : 0,
      },
      campanhas,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}
