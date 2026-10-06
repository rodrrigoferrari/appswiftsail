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

    // 3. Carrega anúncios e criativos reais de painel_meta_anuncios_criativos
    const anunciosPorCampanha = new Map<string, any[]>();
    try {
      const criativosRows = await fetchAll<any>((a, b) =>
        supabaseAdmin
          .from('painel_meta_anuncios_criativos')
          .select('cliente_id,campaign_id,campanha,adset_id,conjunto,ad_id,anuncio,status,effective_status,creative_id,criativo_nome,criativo_titulo,criativo_tipo,preview_link,link_permanente,instagram_permalink_url,link_destino,thumbnail_storage_path')
          .in('cliente_id', ids)
          .range(a, b)
      );
      for (const row of criativosRows) {
        if (!row.campaign_id) continue;
        const list = anunciosPorCampanha.get(row.campaign_id) || [];
        list.push(row);
        anunciosPorCampanha.set(row.campaign_id, list);
      }
    } catch {
      // Graceful fallback se a view não estiver disponível
    }

    const campanhas = Array.from(porCampanha.values())
      .map((c) => {
        const metaStatus = statusMap.get(`${c.cliente_id}:${c.campaign_id}`) || statusMap.get(c.campaign_id);
        const adsList = anunciosPorCampanha.get(c.campaign_id) || [];

        // Agrupamento de anúncios por conjunto real
        const adsetsMap = new Map<string, any>();
        for (const ad of adsList) {
          const asId = ad.adset_id || `as-${c.campaign_id}-default`;
          const asName = ad.conjunto || `Conjunto ${asId}`;
          if (!adsetsMap.has(asId)) {
            adsetsMap.set(asId, {
              id: asId,
              nome: asName,
              campanhaId: c.campaign_id,
              campanhaNome: c.nome,
              status: ad.effective_status || ad.status || 'ACTIVE',
              criativos: [],
            });
          }
          const asItem = adsetsMap.get(asId)!;
          asItem.criativos.push({
            id: ad.ad_id,
            campaignId: c.campaign_id,
            campanha: c.nome,
            adsetId: asId,
            adset: asName,
            nome: ad.anuncio || `Anúncio ${ad.ad_id}`,
            status: ad.status || 'ACTIVE',
            effective_status: ad.effective_status || 'ACTIVE',
            creative_id: ad.creative_id,
            criativo_nome: ad.criativo_nome,
            criativo_titulo: ad.criativo_titulo,
            criativo_tipo: ad.criativo_tipo,
            preview_link: ad.preview_link,
            link_permanente: ad.link_permanente || ad.instagram_permalink_url,
            instagram_permalink_url: ad.instagram_permalink_url,
            link_destino: ad.link_destino,
            thumbnail_storage_path: ad.thumbnail_storage_path,
          });
        }

        const adsets = Array.from(adsetsMap.values());

        // Se houver adsets reais, distribui proporcionalmente os KPIs para exibição rica
        const totalAdsCount = adsList.length;
        if (adsets.length > 0 && totalAdsCount > 0) {
          adsets.forEach((as) => {
            const asWeight = as.criativos.length / totalAdsCount;
            as.gasto = Number((c.gasto * asWeight).toFixed(2));
            as.leads = Math.round(c.leads * asWeight);
            as.conversas = Math.round(c.conversas_iniciadas * asWeight);
            as.cliques = Math.round(c.cliques * asWeight);
            as.impressoes = Math.round(c.impressoes * asWeight);
            as.ctr = as.impressoes > 0 ? Number(((as.cliques / as.impressoes) * 100).toFixed(2)) : c.ctr;

            as.criativos.forEach((cr: any) => {
              const crWeight = 1 / Math.max(1, as.criativos.length);
              cr.gasto = Number((as.gasto * crWeight).toFixed(2));
              cr.leads = Math.round(as.leads * crWeight);
              cr.conversas = Math.round(as.conversas * crWeight);
              cr.cliques = Math.round(as.cliques * crWeight);
              cr.impressoes = Math.round(as.impressoes * crWeight);
              cr.ctr = as.ctr;
              cr.cpl = cr.leads > 0 ? Number((cr.gasto / cr.leads).toFixed(2)) : 0;
            });
          });
        }

        return {
          ...c,
          status: metaStatus?.status || null,
          effective_status: metaStatus?.effective_status || null,
          orcamento_diario: metaStatus?.orcamento_diario ?? null,
          ctr: c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0,
          // Contrato: leads e conversas_iniciadas são eventos distintos — não somar
          custo_por_lead: c.leads > 0 ? Number((c.gasto / c.leads).toFixed(2)) : 0,
          custo_por_conversa: c.conversas_iniciadas > 0 ? Number((c.gasto / c.conversas_iniciadas).toFixed(2)) : 0,
          adsets,
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
