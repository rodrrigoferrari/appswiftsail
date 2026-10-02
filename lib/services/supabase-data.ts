import { supabaseAdmin } from '@/lib/supabase/admin';
import { Cliente, GroupAdAccount, GroupAdMapping, AgenteEvento, CsStatus, WhatsAppDailySummary } from '@/types/database';

export async function getClientes(): Promise<Cliente[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('status', 'ativo')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Error fetching clientes:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching clientes:', err);
    return [];
  }
}


export async function getGroupAdAccounts(): Promise<GroupAdAccount[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('group_ad_accounts')
      .select('*')
      .order('account_name', { ascending: true });

    if (error) {
      console.error('Error fetching group_ad_accounts:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching group_ad_accounts:', err);
    return [];
  }
}

export async function getGroupAdMappings(): Promise<GroupAdMapping[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('group_ad_mapping')
      .select('*')
      .order('client_name', { ascending: true });

    if (error) {
      console.error('Error fetching group_ad_mapping:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching group_ad_mapping:', err);
    return [];
  }
}

export async function getAgentesEventos(): Promise<AgenteEvento[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('agentes_eventos')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching agentes_eventos:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Unexpected error fetching agentes_eventos:', err);
    return [];
  }
}

export async function getCsStatus(): Promise<CsStatus[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('cs_status')
      .select('*')
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

export async function getUltimasSyncRodadas() {
  try {
    const { data, error } = await supabaseAdmin
      .schema('ads')
      .from('sync_rodadas')
      .select('*')
      .order('iniciado_em', { ascending: false })
      .limit(10);

    if (error) {
      // Fallback if ads schema query is restricted
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

