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

    const ids = await resolveClientesAtivos(cliente_id);
    if (ids === null) {
      return NextResponse.json({ success: false, error: 'Cliente inativo ou inexistente' }, { status: 404 });
    }
    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        cliente_id,
        periodo: { from, to },
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

    // 1. Carrega catálogo de etapas de painel_kommo_etapas (para mapear nomes e conta_como)
    const etapasMap = new Map<string, KommoEtapaPainel>();
    try {
      const etapas = await fetchAll<KommoEtapaPainel>((a, b) =>
        supabaseAdmin
          .from('painel_kommo_etapas')
          .select('cliente_id,pipeline_id,pipeline_nome,status_id,etapa_nome,conta_como')
          .in('cliente_id', ids)
          .range(a, b)
      );
      for (const e of etapas) {
        etapasMap.set(`${e.cliente_id}:${e.status_id}`, e);
        etapasMap.set(`${e.pipeline_id}:${e.status_id}`, e);
        etapasMap.set(String(e.status_id), e);
      }
    } catch {
      // Se a view ainda não estiver acessível, segue com fallback de IDs
    }

    // 2. View painel_kommo_leads_resumo: sem PII, excluido_em IS NULL, só clientes ativos
    let rows: KommoLinha[];
    try {
      rows = await fetchAll<KommoLinha>((a, b) =>
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

    const origens: Record<string, number> = {};
    const campanhas: Record<string, number> = {};
    const etapasContagem: Record<string, { pipeline_nome: string; etapa_nome: string; conta_como: string; total: number; valor: number }> = {};
    const resumoStatus = {
      aberta: { total: 0, valor: 0 },
      ganho: { total: 0, valor: 0 },
      perda: { total: 0, valor: 0 },
    };
    let valorTotal = 0;

    for (const l of rows) {
      const origem = l.origem || l.utm_source || '(sem origem)';
      origens[origem] = (origens[origem] || 0) + 1;

      const camp = l.campanha_nome || l.utm_campaign;
      if (camp) campanhas[camp] = (campanhas[camp] || 0) + 1;

      const v = Number(l.valor) || 0;
      valorTotal += v;

      // Resolução de etapa e conta_como
      const etapa =
        (l.status_id ? etapasMap.get(`${l.cliente_id}:${l.status_id}`) : null) ||
        (l.status_id && l.pipeline_id ? etapasMap.get(`${l.pipeline_id}:${l.status_id}`) : null) ||
        (l.status_id ? etapasMap.get(String(l.status_id)) : null);

      const contaComo = (etapa?.conta_como?.toLowerCase() as 'aberta' | 'ganho' | 'perda') || 'aberta';
      if (resumoStatus[contaComo]) {
        resumoStatus[contaComo].total += 1;
        resumoStatus[contaComo].valor += v;
      }

      const etapaKey = `${l.pipeline_id || 0}:${l.status_id || 0}`;
      if (!etapasContagem[etapaKey]) {
        etapasContagem[etapaKey] = {
          pipeline_nome: etapa?.pipeline_nome || `Funil #${l.pipeline_id || 'Geral'}`,
          etapa_nome: etapa?.etapa_nome || `Etapa #${l.status_id || 'Inicial'}`,
          conta_como: contaComo,
          total: 0,
          valor: 0,
        };
      }
      etapasContagem[etapaKey].total += 1;
      etapasContagem[etapaKey].valor += v;
    }

    return NextResponse.json({
      success: true,
      cliente_id,
      periodo: { from, to },
      total_leads: rows.length,
      valor_total: valorTotal,
      resumo_status: resumoStatus,
      por_etapa: Object.values(etapasContagem).sort((a, b) => b.total - a.total),
      por_origem: Object.entries(origens).map(([origem, total]) => ({ origem, total })).sort((a, b) => b.total - a.total),
      por_campanha: Object.entries(campanhas).map(([campanha, total]) => ({ campanha, total })).sort((a, b) => b.total - a.total),
    });
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Erro interno' }, { status: 500 });
  }
}
