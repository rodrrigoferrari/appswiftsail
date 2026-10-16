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
          .select('cliente_id,plataforma,campaign_id,campanha,status,effective_status,orcamento_diario,objetivo,objetivo_padrao')
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

    // 3. Só considera campanhas que efetivamente rodaram no período (gasto, impressões, cliques ou leads/conversas > 0)
    const activeCampanhasList = Array.from(porCampanha.values()).filter(
      (c) =>
        Number(c.gasto || 0) > 0 ||
        Number(c.impressoes || 0) > 0 ||
        Number(c.cliques || 0) > 0 ||
        Number(c.leads || 0) > 0 ||
        Number(c.conversas_iniciadas || 0) > 0
    );

    const activeCampIds = new Set(activeCampanhasList.map((c) => c.campaign_id));

    // 4. Carrega anúncios e criativos reais de painel_meta_anuncios_criativos
    // Filtrando estritamente para não trazer histórico inativo que não rodou no período
    const anunciosPorCampanha = new Map<string, any[]>();
    if (activeCampIds.size > 0) {
      try {
        const criativosRows = await fetchAll<any>((a, b) =>
          supabaseAdmin
            .from('painel_meta_anuncios_criativos')
            .select('cliente_id,campaign_id,campanha,adset_id,conjunto,ad_id,anuncio,status,effective_status,creative_id,criativo_nome,criativo_titulo,criativo_tipo,preview_link,link_permanente,instagram_permalink_url,link_destino,thumbnail_storage_path,midia_storage_path,video_storage_path,created_time,updated_time')
            .in('cliente_id', ids)
            .range(a, b)
        );

        // Agrupa todos os anúncios pertencentes às campanhas que rodaram no período
        const rawAdsPorCamp = new Map<string, any[]>();
        for (const row of criativosRows) {
          if (!row.campaign_id || !activeCampIds.has(row.campaign_id)) continue;
          const list = rawAdsPorCamp.get(row.campaign_id) || [];
          list.push(row);
          rawAdsPorCamp.set(row.campaign_id, list);
        }

        // Filtra estritamente por anúncios e conjuntos que tiveram veiculação no período selecionado:
        // 1. Efetivamente ATIVOS no leilão (effective_status === 'ACTIVE')
        // 2. Anúncios ativos em campanhas que foram pausadas recentemente (CAMPAIGN_PAUSED com status ACTIVE)
        // 3. Anúncios criados ou pausados/atualizados durante o período selecionado (from <= data <= to)
        // Anúncios com ADSET_PAUSED antigos ou PAUSED há meses/anos são estritamente excluídos.
        for (const [campId, ads] of rawAdsPorCamp.entries()) {
          const adsComVeiculacao = ads.filter((a) => {
            if (a.effective_status === 'ACTIVE') return true;
            if (a.effective_status === 'CAMPAIGN_PAUSED' && a.status === 'ACTIVE') return true;

            const updatedDate = a.updated_time ? a.updated_time.slice(0, 10) : '';
            const createdDate = a.created_time ? a.created_time.slice(0, 10) : '';
            const inPeriod = (updatedDate >= from && updatedDate <= to) || (createdDate >= from && createdDate <= to);

            if (inPeriod && (a.effective_status === 'PAUSED' || a.effective_status === 'CAMPAIGN_PAUSED') && a.status !== 'DELETED' && a.status !== 'ARCHIVED') {
              return true;
            }

            return false;
          });

          if (adsComVeiculacao.length > 0) {
            anunciosPorCampanha.set(campId, adsComVeiculacao);
          }
        }
      } catch {
        // Graceful fallback se a view não estiver disponível
      }
    }

    const campanhas = activeCampanhasList
      .map((c) => {
        const metaStatus = statusMap.get(`${c.cliente_id}:${c.campaign_id}`) || statusMap.get(c.campaign_id);
        const adsList = anunciosPorCampanha.get(c.campaign_id) || [];
        const campNome = c.nome || metaStatus?.campanha || adsList[0]?.campanha || `Campanha ${c.campaign_id}`;

        // Agrupamento de anúncios por conjunto real que teve veiculação
        const adsetsMap = new Map<string, any>();
        for (const ad of adsList) {
          const asId = ad.adset_id || `as-${c.campaign_id}-default`;
          const asName = ad.conjunto || `Conjunto ${asId}`;
          if (!adsetsMap.has(asId)) {
            adsetsMap.set(asId, {
              id: asId,
              nome: asName,
              campanhaId: c.campaign_id,
              campanhaNome: campNome,
              status: ad.effective_status || ad.status || 'ACTIVE',
              criativos: [],
            });
          }
          const asItem = adsetsMap.get(asId)!;
          const effectiveThumb = ad.thumbnail_storage_path
            ? ad.thumbnail_storage_path
            : ad.midia_storage_path
            ? `/api/meta/media?path=${encodeURIComponent(ad.midia_storage_path)}`
            : null;

          asItem.criativos.push({
            id: ad.ad_id,
            campaignId: c.campaign_id,
            campanha: campNome,
            adsetId: asId,
            adset: asName,
            nome: ad.anuncio || ad.criativo_nome || `Anúncio ${ad.ad_id}`,
            status: ad.status || 'ACTIVE',
            effective_status: ad.effective_status || 'ACTIVE',
            creative_id: ad.creative_id,
            criativo_nome: ad.criativo_nome,
            criativo_titulo: ad.criativo_titulo?.trim() || ad.anuncio || `Anúncio ${ad.ad_id}`,
            criativo_tipo: ad.criativo_tipo,
            preview_link: ad.preview_link,
            link_permanente: ad.link_permanente || ad.instagram_permalink_url,
            instagram_permalink_url: ad.instagram_permalink_url,
            link_destino: ad.link_destino,
            thumbnail_storage_path: effectiveThumb,
            midia_storage_path: ad.midia_storage_path,
            video_storage_path: ad.video_storage_path,
            objetivo: metaStatus?.objetivo || null,
            objetivo_padrao: metaStatus?.objetivo_padrao || null,
            campanha_gasto: c.gasto,
            campanha_leads: c.leads,
            campanha_conversas: c.conversas_iniciadas,
            campanha_ctr: c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0,
          });
        }

        const adsets = Array.from(adsetsMap.values());

        // Atribuição de métricas respeitando integridade de dados reais:
        // 1. Se a campanha possui apenas 1 conjunto: 100% da métrica pertence a ele
        if (adsets.length === 1) {
          const onlyAdset = adsets[0];
          onlyAdset.gasto = c.gasto;
          onlyAdset.leads = c.leads;
          onlyAdset.conversas = c.conversas_iniciadas;
          onlyAdset.cliques = c.cliques;
          onlyAdset.impressoes = c.impressoes;
          onlyAdset.ctr = c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0;
          onlyAdset.isCbo = false;

          if (onlyAdset.criativos.length === 1) {
            const onlyCreative = onlyAdset.criativos[0];
            onlyCreative.gasto = c.gasto;
            onlyCreative.leads = c.leads;
            onlyCreative.conversas = c.conversas_iniciadas;
            onlyCreative.cliques = c.cliques;
            onlyCreative.impressoes = c.impressoes;
            onlyCreative.ctr = onlyAdset.ctr;
            onlyCreative.cpl = c.leads > 0 ? Number((c.gasto / c.leads).toFixed(2)) : 0;
            onlyCreative.custo_por_conversa = c.conversas_iniciadas > 0 ? Number((c.gasto / c.conversas_iniciadas).toFixed(2)) : 0;
            onlyCreative.isCbo = false;
          } else {
            // Múltiplos criativos no conjunto único: a entrega é otimizada pela Meta
            onlyAdset.criativos.forEach((cr: any) => {
              cr.gasto = null;
              cr.leads = null;
              cr.conversas = null;
              cr.cliques = null;
              cr.impressoes = null;
              cr.ctr = onlyAdset.ctr;
              cr.cpl = null;
              cr.custo_por_conversa = null;
              cr.isCbo = true;
            });
          }
        } else if (adsets.length > 1) {
          // 2. Múltiplos conjuntos (CBO / Advantage Campaign Budget):
          // O leilão da Meta aloca o orçamento de forma dinâmica no nível de campanha.
          // Nunca dividir artificialmente por N (ex: R$ 266 / 3) para não gerar métricas falsas.
          const campCtr = c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0;

          adsets.forEach((as) => {
            as.gasto = null;
            as.leads = null;
            as.conversas = null;
            as.cliques = null;
            as.impressoes = null;
            as.ctr = campCtr;
            as.isCbo = true;

            as.criativos.forEach((cr: any) => {
              cr.gasto = null;
              cr.leads = null;
              cr.conversas = null;
              cr.cliques = null;
              cr.impressoes = null;
              cr.ctr = campCtr;
              cr.cpl = null;
              cr.custo_por_conversa = null;
              cr.isCbo = true;
            });
          });
        }

        return {
          ...c,
          nome: campNome,
          status: metaStatus?.status || null,
          effective_status: metaStatus?.effective_status || null,
          orcamento_diario: metaStatus?.orcamento_diario ?? null,
          objetivo: metaStatus?.objetivo || null,
          objetivo_padrao: metaStatus?.objetivo_padrao || null,
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

    // 4. Carrega informações de faturamento e contas Meta de painel_contas_ads
    // tipo_pagamento, saldo_disponivel, cartao_final, limite_restante
    let contas: any[] = [];
    try {
      const { data: contasData } = await supabaseAdmin
        .from('painel_contas_ads')
        .select('cliente_id,plataforma,account_id,nome,status,moeda,tipo_pagamento,saldo_disponivel,cartao_final,limite_restante,conta_pagamento')
        .eq('plataforma', 'meta')
        .in('cliente_id', ids);
      contas = contasData || [];
    } catch {
      // Graceful fallback
    }

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
      contas,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}
