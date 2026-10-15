import { supabaseAdmin } from '@/lib/supabase/admin';
import { Cliente, ContaAdsPainel, GoogleAnuncioPainel, KommoPipelineResumo } from '@/types/database';

/**
 * Busca clientes com status 'ativo' diretamente da tabela pública clientes.
 * Contrato de segurança: Somente leitura pelo servidor com service_role.
 */
export async function getClientes(): Promise<Cliente[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('cliente_id,nome,status,parent_cliente_id,grupo_whatsapp_id,drive_folder_id,data_inicio,data_encerramento,atualizado_em')
      .eq('status', 'ativo')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Error fetching clientes:', error);
      return [];
    }
    return (data || []) as Cliente[];
  } catch (err) {
    console.error('Unexpected error fetching clientes:', err);
    return [];
  }
}

/**
 * Consulta contas de anúncio ativas de public.painel_contas_ads.
 * Traz as 4 novas colunas: tipo_pagamento, saldo_disponivel, cartao_final e limite_restante.
 */
export async function getContasAdsPainel(clienteId?: string): Promise<ContaAdsPainel[] | null> {
  try {
    let query = supabaseAdmin
      .from('painel_contas_ads')
      .select('cliente_id,plataforma,account_id,nome,status,moeda,tipo_pagamento,saldo_disponivel,cartao_final,limite_restante,conta_pagamento');

    if (clienteId && clienteId !== 'ALL') {
      query = query.eq('cliente_id', clienteId.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching painel_contas_ads:', error);
      return null;
    }
    return (data || []) as ContaAdsPainel[];
  } catch {
    return null;
  }
}

/**
 * Consulta anúncios do Google Ads em public.painel_google_anuncios.
 * Uma linha por anúncio com link de destino (urls_finais), urls_mobile e tracking_url_template.
 */
export async function getGoogleAnuncios(clienteId?: string): Promise<GoogleAnuncioPainel[]> {
  try {
    let query = supabaseAdmin
      .from('painel_google_anuncios')
      .select('cliente_id,customer_id,campanha_id,campanha_nome,grupo_id,grupo_nome,ad_id,tipo,status,titulos,descricoes,urls_finais,urls_mobile,tracking_url_template');

    if (clienteId && clienteId !== 'ALL') {
      query = query.eq('cliente_id', clienteId.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching painel_google_anuncios:', error);
      return [];
    }
    return (data || []) as GoogleAnuncioPainel[];
  } catch {
    return [];
  }
}

/**
 * Consulta grupos de recursos do Google Ads (Performance Max) em public.painel_google_grupos_recursos.
 */
export async function getGoogleGruposRecursos(clienteId?: string): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('painel_google_grupos_recursos')
      .select('cliente_id,customer_id,campanha_id,campanha_nome,asset_group_id,nome,status,ad_strength,urls_finais');

    if (clienteId && clienteId !== 'ALL') {
      query = query.eq('cliente_id', clienteId.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching painel_google_grupos_recursos:', error);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Consulta palavras-chave do Google Ads em public.painel_google_palavras_chave.
 */
export async function getGooglePalavrasChave(clienteId?: string): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('painel_google_palavras_chave')
      .select('cliente_id,customer_id,campanha_id,campanha_nome,grupo_id,grupo_nome,criterion_id,texto,match_type,status,quality_score,urls_finais');

    if (clienteId && clienteId !== 'ALL') {
      query = query.eq('cliente_id', clienteId.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching painel_google_palavras_chave:', error);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Consulta as últimas rodadas de sincronização em public.painel_sync_rodadas.
 */
export async function getUltimasSyncRodadas() {
  try {
    const { data, error } = await supabaseAdmin
      .from('painel_sync_rodadas')
      .select('fonte,status,iniciado_em,terminado_em,linhas,erro')
      .order('iniciado_em', { ascending: false })
      .limit(20);

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Consulta registros de Customer Success (CS Status) em public.cs_status.
 */
export async function getCsStatusList() {
  try {
    const { data, error } = await supabaseAdmin
      .from('cs_status')
      .select('id,cliente_id,nivel,sinais,data,agente_origem,criado_em')
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('Error fetching cs_status:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching cs_status:', err);
    return [];
  }
}

/**
 * Consulta pipelines/funis do Kommo CRM agrupados por cliente a partir de public.painel_kommo_etapas.
 */
export async function getKommoPipelinesResumo(clienteId?: string): Promise<KommoPipelineResumo[]> {
  try {
    let query = supabaseAdmin
      .from('painel_kommo_etapas')
      .select('cliente_id,pipeline_id,pipeline_nome,status_id');

    if (clienteId && clienteId !== 'ALL') {
      query = query.eq('cliente_id', clienteId.toUpperCase());
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const map = new Map<string, KommoPipelineResumo>();
    data.forEach((e) => {
      const key = `${e.cliente_id}::${e.pipeline_id}`;
      if (!map.has(key)) {
        map.set(key, {
          cliente_id: e.cliente_id,
          pipeline_id: String(e.pipeline_id),
          pipeline_nome: e.pipeline_nome || `Pipeline ${e.pipeline_id}`,
          etapas_count: 0,
        });
      }
      map.get(key)!.etapas_count++;
    });

    return Array.from(map.values());
  } catch (err) {
    console.error('Error fetching kommo pipelines:', err);
    return [];
  }
}

