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

    // 2. View painel_meta_campanhas_dia traz dados agregados por campanha/dia
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

    // 4. Carrega métricas reais de conjuntos de painel_meta_conjuntos_dia
    const porConjunto = new Map<string, any>();
    try {
      const conjuntoRows = await fetchAll<any>((a, b) =>
        supabaseAdmin
          .from('painel_meta_conjuntos_dia')
          .select('cliente_id,campaign_id,campanha,adset_id,conjunto,data,gasto,impressoes,cliques_link,leads,conversas_iniciadas,orcamento_diario')
          .in('cliente_id', ids)
          .gte('data', from)
          .lte('data', to)
          .range(a, b)
      );
      for (const r of conjuntoRows) {
        if (!r.adset_id) continue;
        const key = r.adset_id;
        const as = porConjunto.get(key) || {
          adset_id: r.adset_id,
          campaign_id: r.campaign_id,
          conjunto: r.conjunto,
          gasto: 0,
          impressoes: 0,
          cliques: 0,
          leads: 0,
          conversas: 0,
          orcamento_diario: null,
        };
        as.gasto += Number(r.gasto) || 0;
        as.impressoes += Number(r.impressoes) || 0;
        as.cliques += Number(r.cliques_link) || 0;
        as.leads += Number(r.leads) || 0;
        as.conversas += Number(r.conversas_iniciadas) || 0;
        if (r.orcamento_diario !== null && r.orcamento_diario !== undefined) {
          as.orcamento_diario = Number(r.orcamento_diario);
        }
        porConjunto.set(key, as);
      }
    } catch {
      // Graceful fallback se a view não estiver disponível
    }

    // 5. Carrega métricas reais de anúncios de painel_meta_anuncios_dia
    const porAnuncio = new Map<string, any>();
    try {
      const anuncioRows = await fetchAll<any>((a, b) =>
        supabaseAdmin
          .from('painel_meta_anuncios_dia')
          .select('cliente_id,campaign_id,campanha,adset_id,conjunto,ad_id,anuncio,data,gasto,impressoes,cliques_link,leads,conversas_iniciadas,orcamento_diario')
          .in('cliente_id', ids)
          .gte('data', from)
          .lte('data', to)
          .range(a, b)
      );
      for (const r of anuncioRows) {
        if (!r.ad_id) continue;
        const key = r.ad_id;
        const ad = porAnuncio.get(key) || {
          ad_id: r.ad_id,
          adset_id: r.adset_id,
          campaign_id: r.campaign_id,
          anuncio: r.anuncio,
          gasto: 0,
          impressoes: 0,
          cliques: 0,
          leads: 0,
          conversas: 0,
          orcamento_diario: null,
        };
        ad.gasto += Number(r.gasto) || 0;
        ad.impressoes += Number(r.impressoes) || 0;
        ad.cliques += Number(r.cliques_link) || 0;
        ad.leads += Number(r.leads) || 0;
        ad.conversas += Number(r.conversas_iniciadas) || 0;
        if (r.orcamento_diario !== null && r.orcamento_diario !== undefined) {
          ad.orcamento_diario = Number(r.orcamento_diario);
        }
        porAnuncio.set(key, ad);
      }
    } catch {
      // Graceful fallback se a view não estiver disponível
    }

    // 6. Carrega anúncios e criativos cadastrais de painel_meta_anuncios_criativos
    // Para obter mídia, thumbnail, URLs de prévia e links permanentes
    const criativosMap = new Map<string, any>();
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

        for (const row of criativosRows) {
          if (row.ad_id) {
            criativosMap.set(row.ad_id, row);
          }
          if (!row.campaign_id || !activeCampIds.has(row.campaign_id)) continue;
          const list = anunciosPorCampanha.get(row.campaign_id) || [];
          list.push(row);
          anunciosPorCampanha.set(row.campaign_id, list);
        }
      } catch {
        // Graceful fallback se a view não estiver disponível
      }
    }

    const campanhas = activeCampanhasList
      .map((c) => {
        const metaStatus = statusMap.get(`${c.cliente_id}:${c.campaign_id}`) || statusMap.get(c.campaign_id);
        const rawAdsList = anunciosPorCampanha.get(c.campaign_id) || [];
        const campNome = c.nome || metaStatus?.campanha || rawAdsList[0]?.campanha || `Campanha ${c.campaign_id}`;

        const campCtr = c.impressoes > 0 ? Number(((c.cliques / c.impressoes) * 100).toFixed(2)) : 0;
        const campCpl = c.leads > 0 ? Number((c.gasto / c.leads).toFixed(2)) : 0;
        const campCustoConv = c.conversas_iniciadas > 0 ? Number((c.gasto / c.conversas_iniciadas).toFixed(2)) : 0;

        // 1. Identifica todos os conjuntos desta campanha que rodaram no período (via painel_meta_conjuntos_dia)
        // Se a view não tiver linhas, faz fallback para rawAdsList
        const campAdsetsFromDb = Array.from(porConjunto.values()).filter((as) => as.campaign_id === c.campaign_id);
        const adsetIds = new Set<string>();

        for (const as of campAdsetsFromDb) {
          adsetIds.add(as.adset_id);
        }
        for (const ad of rawAdsList) {
          if (ad.adset_id) adsetIds.add(ad.adset_id);
        }

        const adsetsMap = new Map<string, any>();

        for (const asId of adsetIds) {
          const asMetrics = porConjunto.get(asId);
          const sampleRaw = rawAdsList.find((a) => a.adset_id === asId);
          const asName = asMetrics?.conjunto || sampleRaw?.conjunto || `Conjunto ${asId}`;

          const asGasto = asMetrics ? Number(asMetrics.gasto || 0) : null;
          const asLeads = asMetrics ? Number(asMetrics.leads || 0) : 0;
          const asConversas = asMetrics ? Number(asMetrics.conversas || 0) : 0;
          const asCliques = asMetrics ? Number(asMetrics.cliques || 0) : 0;
          const asImpressoes = asMetrics ? Number(asMetrics.impressoes || 0) : 0;
          const asOrcamento = asMetrics?.orcamento_diario !== null && asMetrics?.orcamento_diario !== undefined ? Number(asMetrics.orcamento_diario) : null;

          const hasRealAsMetrics = asMetrics !== undefined;
          const asCtr = asImpressoes > 0 ? Number(((asCliques / asImpressoes) * 100).toFixed(2)) : campCtr;
          const asCpl = asLeads > 0 && asGasto !== null ? Number((asGasto / asLeads).toFixed(2)) : (asLeads === 0 && asGasto !== null && asGasto > 0 ? 0 : campCpl);
          const asCustoConv = asConversas > 0 && asGasto !== null ? Number((asGasto / asConversas).toFixed(2)) : (asConversas === 0 && asGasto !== null && asGasto > 0 ? 0 : campCustoConv);

          // CBO se o orçamento diário do conjunto for nulo (gerenciado no nível de campanha)
          const isCbo = asOrcamento === null || asOrcamento === undefined || asOrcamento === 0;

          adsetsMap.set(asId, {
            id: asId,
            nome: asName,
            campanhaId: c.campaign_id,
            campanhaNome: campNome,
            status: sampleRaw?.effective_status || sampleRaw?.status || 'ACTIVE',
            gasto: hasRealAsMetrics ? asGasto : null,
            leads: hasRealAsMetrics ? asLeads : null,
            conversas: hasRealAsMetrics ? asConversas : null,
            cliques: hasRealAsMetrics ? asCliques : null,
            impressoes: hasRealAsMetrics ? asImpressoes : null,
            ctr: asCtr,
            cpl: asCpl,
            custo_por_conversa: asCustoConv,
            orcamento_diario: asOrcamento,
            orcamento: asOrcamento ? `R$ ${asOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia` : (metaStatus?.orcamento_diario ? `R$ ${Number(metaStatus.orcamento_diario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/dia (CBO)` : 'CBO'),
            isCbo,
            campanha_gasto: c.gasto,
            campanha_leads: c.leads,
            campanha_conversas: c.conversas_iniciadas,
            campanha_cpl: campCpl,
            campanha_custo_por_conversa: campCustoConv,
            criativos: [],
          });
        }

        // 2. Associa anúncios/criativos aos seus conjuntos com métricas reais por anúncio
        // Obtém todos os anúncios que rodaram no período para esta campanha
        const campAdsFromDb = Array.from(porAnuncio.values()).filter((ad) => ad.campaign_id === c.campaign_id);
        const processedAdIds = new Set<string>();

        // Processa primeiro os anúncios que efetivamente tiveram veiculação no período
        for (const adMetrics of campAdsFromDb) {
          processedAdIds.add(adMetrics.ad_id);
          const asId = adMetrics.adset_id || `as-${c.campaign_id}-default`;
          const asItem = adsetsMap.get(asId);
          if (!asItem) continue;

          const rawInfo = criativosMap.get(adMetrics.ad_id);
          const effectiveThumb = rawInfo?.thumbnail_storage_path
            ? rawInfo.thumbnail_storage_path
            : rawInfo?.midia_storage_path
            ? `/api/meta/media?path=${encodeURIComponent(rawInfo.midia_storage_path)}`
            : null;

          const adGasto = Number(adMetrics.gasto || 0);
          const adLeads = Number(adMetrics.leads || 0);
          const adConv = Number(adMetrics.conversas || 0);
          const adCliques = Number(adMetrics.cliques || 0);
          const adImp = Number(adMetrics.impressoes || 0);

          const adCtr = adImp > 0 ? Number(((adCliques / adImp) * 100).toFixed(2)) : asItem.ctr;
          const adCpl = adLeads > 0 ? Number((adGasto / adLeads).toFixed(2)) : (adGasto > 0 ? 0 : asItem.cpl);
          const adCustoConv = adConv > 0 ? Number((adGasto / adConv).toFixed(2)) : (adGasto > 0 ? 0 : asItem.custo_por_conversa);

          asItem.criativos.push({
            id: adMetrics.ad_id,
            campaignId: c.campaign_id,
            campanha: campNome,
            adsetId: asId,
            adset: asItem.nome,
            nome: rawInfo?.anuncio || adMetrics.anuncio || rawInfo?.criativo_nome || `Anúncio ${adMetrics.ad_id}`,
            status: rawInfo?.status || 'ACTIVE',
            effective_status: rawInfo?.effective_status || 'ACTIVE',
            creative_id: rawInfo?.creative_id,
            criativo_nome: rawInfo?.criativo_nome,
            criativo_titulo: rawInfo?.criativo_titulo?.trim() || rawInfo?.anuncio || adMetrics.anuncio || `Anúncio ${adMetrics.ad_id}`,
            criativo_tipo: rawInfo?.criativo_tipo,
            preview_link: rawInfo?.preview_link,
            link_permanente: rawInfo?.link_permanente || rawInfo?.instagram_permalink_url,
            instagram_permalink_url: rawInfo?.instagram_permalink_url,
            link_destino: rawInfo?.link_destino,
            thumbnail_storage_path: effectiveThumb,
            midia_storage_path: rawInfo?.midia_storage_path,
            video_storage_path: rawInfo?.video_storage_path,
            objetivo: metaStatus?.objetivo || null,
            objetivo_padrao: metaStatus?.objetivo_padrao || null,
            gasto: adGasto,
            leads: adLeads,
            conversas: adConv,
            cliques: adCliques,
            impressoes: adImp,
            ctr: adCtr,
            cpl: adCpl,
            custo_por_conversa: adCustoConv,
            isCbo: asItem.isCbo,
            campanha_gasto: c.gasto,
            campanha_leads: c.leads,
            campanha_conversas: c.conversas_iniciadas,
            campanha_cpl: campCpl,
            campanha_custo_por_conversa: campCustoConv,
            campanha_ctr: campCtr,
          });
        }

        // Processa criativos ativos de painel_meta_anuncios_criativos que não tiveram veiculação no período
        for (const rawAd of rawAdsList) {
          if (processedAdIds.has(rawAd.ad_id)) continue;
          const asId = rawAd.adset_id || `as-${c.campaign_id}-default`;
          const asItem = adsetsMap.get(asId);
          if (!asItem) continue;

          const effectiveThumb = rawAd.thumbnail_storage_path
            ? rawAd.thumbnail_storage_path
            : rawAd.midia_storage_path
            ? `/api/meta/media?path=${encodeURIComponent(rawAd.midia_storage_path)}`
            : null;

          asItem.criativos.push({
            id: rawAd.ad_id,
            campaignId: c.campaign_id,
            campanha: campNome,
            adsetId: asId,
            adset: asItem.nome,
            nome: rawAd.anuncio || rawAd.criativo_nome || `Anúncio ${rawAd.ad_id}`,
            status: rawAd.status || 'ACTIVE',
            effective_status: rawAd.effective_status || 'ACTIVE',
            creative_id: rawAd.creative_id,
            criativo_nome: rawAd.criativo_nome,
            criativo_titulo: rawAd.criativo_titulo?.trim() || rawAd.anuncio || `Anúncio ${rawAd.ad_id}`,
            criativo_tipo: rawAd.criativo_tipo,
            preview_link: rawAd.preview_link,
            link_permanente: rawAd.link_permanente || rawAd.instagram_permalink_url,
            instagram_permalink_url: rawAd.instagram_permalink_url,
            link_destino: rawAd.link_destino,
            thumbnail_storage_path: effectiveThumb,
            midia_storage_path: rawAd.midia_storage_path,
            video_storage_path: rawAd.video_storage_path,
            objetivo: metaStatus?.objetivo || null,
            objetivo_padrao: metaStatus?.objetivo_padrao || null,
            gasto: 0,
            leads: 0,
            conversas: 0,
            cliques: 0,
            impressoes: 0,
            ctr: asItem.ctr,
            cpl: 0,
            custo_por_conversa: 0,
            isCbo: asItem.isCbo,
            campanha_gasto: c.gasto,
            campanha_leads: c.leads,
            campanha_conversas: c.conversas_iniciadas,
            campanha_cpl: campCpl,
            campanha_custo_por_conversa: campCustoConv,
            campanha_ctr: campCtr,
          });
        }

        // Filtra adsets que efetivamente tiveram veiculação ou criativos ativos
        const adsets = Array.from(adsetsMap.values()).filter(
          (as) => (as.gasto !== null && as.gasto > 0) || (as.impressoes !== null && as.impressoes > 0) || as.criativos.length > 0
        );

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
