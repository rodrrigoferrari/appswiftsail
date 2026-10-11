import { supabaseAdmin } from '@/lib/supabase/admin';
import { Cliente, ContaAdsPainel } from '@/types/database';

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
 */
export async function getContasAdsPainel(): Promise<ContaAdsPainel[] | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('painel_contas_ads')
      .select('cliente_id,plataforma,account_id,nome,status,moeda');
    if (error) return null;
    return (data || []) as ContaAdsPainel[];
  } catch {
    return null;
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
