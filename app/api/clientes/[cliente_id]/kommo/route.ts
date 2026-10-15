import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveClientesAtivos, fetchAll, indisponivel } from '@/lib/services/painel';
import { diasAtrasBRT, hojeBRT } from '@/lib/date';
import { KommoEtapaPainel } from '@/types/database';

export const dynamic = 'force-dynamic';

interface KommoLinha {
  cliente_id: string;
  criado_em: string;
  origem: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  campanha_nome: string | null;
  pipeline_id: number | string | null;
  status_id: number | string | null;
  valor: number | null;
}

export async function GET(request: Request, { params }: { params: Promise<{ cliente_id: string }> }) {
  try {
    const { cliente_id } = await params;
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || diasAtrasBRT(29);
    const to = searchParams.get('to') || hojeBRT();
    const filtroPipeline = searchParams.get('pipeline') || searchParams.get('funil') || 'ALL';

    const ids = await resolveClientesAtivos(cliente_id);
    if (ids === null) {
      return NextResponse.json({ success: false, error: 'Cliente inativo ou inexistente' }, { status: 404 });
    }
    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
        funil_selecionado: filtroPipeline,
        funis: [],
        total_leads: 0,
        valor_total: 0,
        resumo_status: { aberta: { total: 0, valor: 0 }, ganho: { total: 0, valor: 0 }, perda: { total: 0, valor: 0 } },
        por_etapa: [],
        por_origem: [],
        por_campanha: [],
      });
    }

    // Período em horário de Brasília (contrato do Cleide)
    const inicio = `${from}T00:00:00-03:00`;
    const fim = `${to}T23:59:59.999-03:00`;

    // 1. Carrega catálogo de etapas e funis de painel_kommo_etapas
    const etapasMap = new Map<string, KommoEtapaPainel>();
    const funisCatalogoMap = new Map<string, { id: string; nome: string }>();
    const todasEtapasCatalogo: KommoEtapaPainel[] = [];

    try {
      const etapas = await fetchAll<KommoEtapaPainel>((a, b) =>
        supabaseAdmin
          .from('painel_kommo_etapas')
          .select('cliente_id,pipeline_id,pipeline_nome,status_id,etapa_nome,conta_como')
          .in('cliente_id', ids)
          .range(a, b)
      );
      todasEtapasCatalogo.push(...etapas);
      let ordIdx = 0;
      for (const e of etapas) {
        (e as any).ordem = ordIdx++;
        etapasMap.set(`${e.cliente_id}:${e.status_id}`, e);
        etapasMap.set(`${e.pipeline_id}:${e.status_id}`, e);
        etapasMap.set(String(e.status_id), e);

        if (e.pipeline_id && e.pipeline_nome) {
          funisCatalogoMap.set(String(e.pipeline_id), {
            id: String(e.pipeline_id),
            nome: e.pipeline_nome,
          });
        }
      }
    } catch {
      // Se a view ainda não estiver acessível, segue com fallback de IDs
    }

    // 2. View painel_kommo_leads: com nomes reais de contatos, criativos, públicos e termos de busca
    let allRows: any[] = [];

    try {
      allRows = await fetchAll<any>((a, b) =>
        supabaseAdmin
          .from('painel_kommo_leads')
          .select('cliente_id,conta,lead_id,contato_principal_nome,criado_em,origem,utm_source,utm_campaign,campanha_nome,publico,utm_medium,criativo_nome,utm_content,termo_busca,utm_term,pipeline_id,pipeline_nome,status_id,etapa_nome,conta_como,valor,url_lead,dias_estagnados,responsavel_id,responsavel_nome')
          .in('cliente_id', ids)
          .gte('criado_em', inicio)
          .lte('criado_em', fim)
          .order('criado_em')
          .range(a, b)
      );
    } catch {
      // Fallback para painel_kommo_leads_resumo se a view detalhada não responder
      try {
        allRows = await fetchAll<KommoLinha>((a, b) =>
          supabaseAdmin
            .from('painel_kommo_leads_resumo')
            .select('cliente_id,criado_em,origem,utm_source,utm_campaign,campanha_nome,pipeline_id,status_id,valor')
            .in('cliente_id', ids)
            .gte('criado_em', inicio)
            .lte('criado_em', fim)
            .order('criado_em')
            .range(a, b)
        );
      } catch (dbErr) {
        return NextResponse.json(indisponivel(dbErr), { status: 503 });
      }
    }

    // 3. Contabilização dos funis (todos os funis disponíveis para o seletor)
    const isMultiClient = ids.length > 1;
    const funisContagemMap = new Map<
      string,
      { id: string; nome: string; total_leads: number; aberta: number; ganho: number; perda: number; valor: number }
    >();

    // Inicializa com os funis do catálogo de etapas
    for (const f of funisCatalogoMap.values()) {
      const key = isMultiClient ? f.nome.trim() : f.id;
      if (!funisContagemMap.has(key)) {
        funisContagemMap.set(key, {
          id: key,
          nome: f.nome.trim(),
          total_leads: 0,
          aberta: 0,
          ganho: 0,
          perda: 0,
          valor: 0,
        });
      }
    }

    // Popula contagens por funil com base em todos os leads do período
    for (const l of allRows) {
      const pId = String(l.pipeline_id || '0');
      const rawNome = l.pipeline_nome || funisCatalogoMap.get(pId)?.nome || `Funil #${pId}`;
      const pNome = rawNome.trim();
      const key = isMultiClient ? pNome : pId;

      if (!funisContagemMap.has(key)) {
        funisContagemMap.set(key, {
          id: key,
          nome: pNome,
          total_leads: 0,
          aberta: 0,
          ganho: 0,
          perda: 0,
          valor: 0,
        });
      }

      const item = funisContagemMap.get(key)!;
      item.total_leads += 1;
      const cComo = (l.conta_como || 'aberta').toLowerCase();
      if (cComo === 'ganho') item.ganho += 1;
      else if (cComo === 'perda') item.perda += 1;
      else item.aberta += 1;
      item.valor += Number(l.valor) || 0;
    }

    // Lista de funis ordenada por volume de leads (funis com mais movimento primeiro)
    const funis = Array.from(funisContagemMap.values()).sort((a, b) => b.total_leads - a.total_leads);

    // 4. Filtragem por funil (se o usuário escolheu um funil específico no seletor)
    const rows =
      filtroPipeline === 'ALL'
        ? allRows
        : allRows.filter(
            (l) =>
              String(l.pipeline_id) === filtroPipeline ||
              (l.pipeline_nome && l.pipeline_nome.toLowerCase() === filtroPipeline.toLowerCase())
          );

    const origens: Record<string, number> = {};
    const campanhas: Record<string, number> = {};
    const conjuntos: Record<string, { conjunto: string; campanha: string; total: number }> = {};
    const criativos: Record<string, { criativo: string; campanha: string; conjunto: string; total: number }> = {};
    const termos: Record<string, { termo: string; total: number }> = {};
    const responsaveis: Record<string, { id: string; nome: string; total: number; valor: number }> = {};
    const etapasContagem: Record<
      string,
      { pipeline_id: string; pipeline_nome: string; status_id: string; etapa_nome: string; conta_como: string; ordem: number; total: number; valor: number }
    > = {};

    // Pré-popula etapas oficiais do catálogo caso um funil específico tenha sido selecionado
    if (filtroPipeline && filtroPipeline !== 'ALL') {
      for (const e of todasEtapasCatalogo) {
        if (String(e.pipeline_id) === filtroPipeline) {
          const etapaKey = `${e.pipeline_id}:${e.status_id}`;
          etapasContagem[etapaKey] = {
            pipeline_id: String(e.pipeline_id),
            pipeline_nome: e.pipeline_nome || `Funil #${e.pipeline_id}`,
            status_id: String(e.status_id),
            etapa_nome: e.etapa_nome || `Etapa #${e.status_id}`,
            conta_como: (e.conta_como?.toLowerCase() || 'aberta') as 'aberta' | 'ganho' | 'perda',
            ordem: (e as any).ordem ?? 999,
            total: 0,
            valor: 0,
          };
        }
      }
    }
    const leadsAmostra: any[] = [];

    const resumoStatus = {
      aberta: { total: 0, valor: 0 },
      ganho: { total: 0, valor: 0 },
      perda: { total: 0, valor: 0 },
    };
    let valorTotal = 0;

    for (const l of rows) {
      const origem = l.origem || l.utm_source || '(sem origem)';
      origens[origem] = (origens[origem] || 0) + 1;

      const camp =
        l.campanha_nome ||
        l.utm_campaign ||
        (l.publico && l.publico.includes('[') ? l.publico.match(/\[([A-Za-z0-9\s]+)\]/)?.[1]?.trim() : null);
      if (camp) campanhas[camp] = (campanhas[camp] || 0) + 1;

      const conj = l.publico || l.utm_medium;
      if (conj) {
        const key = `${camp || 'Geral'}::${conj}`;
        if (!conjuntos[key]) conjuntos[key] = { conjunto: conj, campanha: camp || 'Geral', total: 0 };
        conjuntos[key].total += 1;
      }

      const cr = l.criativo_nome || l.utm_content;
      if (cr) {
        const key = `${camp || 'Geral'}::${cr}`;
        if (!criativos[key]) criativos[key] = { criativo: cr, campanha: camp || 'Geral', conjunto: conj || 'Público Geral', total: 0 };
        criativos[key].total += 1;
      }

      const rawTb = l.termo_busca || l.utm_term;
      if (rawTb && rawTb !== '{keyword}' && rawTb !== 'Palavra Chave' && rawTb.trim().length > 1) {
        const tb = rawTb.trim();
        termos[tb] = termos[tb] || { termo: tb, total: 0 };
        termos[tb].total += 1;
      }

      const rawRespNome = l.responsavel_nome && String(l.responsavel_nome).trim().length > 0 ? String(l.responsavel_nome).trim() : null;
      const respNome = rawRespNome || (l.responsavel_id ? `Responsável #${l.responsavel_id}` : 'Sem Responsável Atribuído');
      const respId = rawRespNome || (l.responsavel_id ? String(l.responsavel_id) : 'sem_responsavel');
      if (!responsaveis[respId]) {
        responsaveis[respId] = { id: respId, nome: respNome, total: 0, valor: 0 };
      }
      responsaveis[respId].total += 1;
      responsaveis[respId].valor += Number(l.valor) || 0;

      const v = Number(l.valor) || 0;
      valorTotal += v;

      // Resolução de etapa e conta_como
      const etapa =
        (l.status_id ? etapasMap.get(`${l.cliente_id}:${l.status_id}`) : null) ||
        (l.status_id && l.pipeline_id ? etapasMap.get(`${l.pipeline_id}:${l.status_id}`) : null) ||
        (l.status_id ? etapasMap.get(String(l.status_id)) : null);

      const contaComo = (l.conta_como || etapa?.conta_como?.toLowerCase() || 'aberta') as 'aberta' | 'ganho' | 'perda';
      if (resumoStatus[contaComo]) {
        resumoStatus[contaComo].total += 1;
        resumoStatus[contaComo].valor += v;
      }

      const etapaKey = `${l.pipeline_id || 0}:${l.status_id || 0}`;
      if (!etapasContagem[etapaKey]) {
        etapasContagem[etapaKey] = {
          pipeline_id: String(l.pipeline_id || '0'),
          pipeline_nome: l.pipeline_nome || etapa?.pipeline_nome || `Funil #${l.pipeline_id || 'Geral'}`,
          status_id: String(l.status_id || '0'),
          etapa_nome: l.etapa_nome || etapa?.etapa_nome || `Etapa #${l.status_id || 'Inicial'}`,
          conta_como: contaComo,
          ordem: (etapa as any)?.ordem ?? 999,
          total: 0,
          valor: 0,
        };
      }
      etapasContagem[etapaKey].total += 1;
      etapasContagem[etapaKey].valor += v;

      // Coleta leads para exibição real no drilldown de nomes
      if (leadsAmostra.length < 3000 && (l.contato_principal_nome || l.lead_id)) {
        const urlFinal =
          l.url_lead ||
          (l.conta && l.lead_id
            ? `https://${l.conta}.kommo.com/leads/detail/${l.lead_id}`
            : l.lead_id
            ? `https://kommo.com/leads/detail/${l.lead_id}`
            : null);

        leadsAmostra.push({
          lead_id: l.lead_id,
          nome: l.contato_principal_nome || 'Lead sem nome registrado',
          campanha: camp || 'Geral',
          conjunto: conj || null,
          criativo: cr || null,
          origem: origem,
          pipeline_id: String(l.pipeline_id || ''),
          pipeline_nome: l.pipeline_nome || etapa?.pipeline_nome || 'Funil Geral',
          status_id: String(l.status_id || ''),
          etapa: l.etapa_nome || etapa?.etapa_nome || 'Em atendimento',
          conta_como: contaComo,
          criado_em: l.criado_em,
          valor: v,
          conta: l.conta || null,
          url_lead: urlFinal,
          dias_estagnados: l.dias_estagnados !== null && l.dias_estagnados !== undefined ? Number(l.dias_estagnados) : null,
          responsavel_id: l.responsavel_id ? String(l.responsavel_id) : null,
          responsavel_nome: respNome,
          termo_busca: rawTb || null,
        });
      }
    }

    const temContaVinculada = todasEtapasCatalogo.length > 0 || allRows.length > 0;

    return NextResponse.json({
      success: true,
      cliente_id,
      tem_conta_vinculada: temContaVinculada,
      periodo: { from, to },
      funil_selecionado: filtroPipeline,
      funis,
      total_leads: rows.length,
      valor_total: valorTotal,
      resumo_status: resumoStatus,
      por_etapa: Object.values(etapasContagem).sort((a, b) => a.ordem - b.ordem),
      por_origem: Object.entries(origens).map(([origem, total]) => ({ origem, total })).sort((a, b) => b.total - a.total),
      por_campanha: Object.entries(campanhas).map(([campanha, total]) => ({ campanha, total })).sort((a, b) => b.total - a.total),
      por_conjunto: Object.values(conjuntos).sort((a, b) => b.total - a.total),
      por_criativo: Object.values(criativos).sort((a, b) => b.total - a.total),
      por_termo: Object.values(termos).sort((a, b) => b.total - a.total),
      por_responsavel: Object.values(responsaveis).sort((a, b) => b.total - a.total),
      leads_amostra: leadsAmostra,
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}
