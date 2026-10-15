import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Resolve quais cliente_id podem ser consultados.
 * Contrato: só entram clientes com public.clientes.status = 'ativo'.
 * - 'ALL' => todos os ativos
 * - slug específico => [slug] se ativo; null se inativo/inexistente
 */
export async function resolveClientesAtivos(clienteId: string): Promise<string[] | null> {
  const isAll = clienteId.toUpperCase() === 'ALL';

  if (isAll) {
    const { data, error } = await supabaseAdmin.from('clientes').select('cliente_id').eq('status', 'ativo');
    if (error) throw new Error(error.message);
    return (data || []).map((c) => c.cliente_id);
  }

  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select('cliente_id, status, parent_cliente_id')
    .eq('cliente_id', clienteId.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status !== 'ativo') return null;

  const ids = new Set<string>([data.cliente_id]);

  // Se este cliente é filho de uma conta pai ativa (ex: GONZAGA_AMST -> REALIZACOES_GONZAGA)
  if (data.parent_cliente_id) {
    const { data: parent } = await supabaseAdmin
      .from('clientes')
      .select('cliente_id, status')
      .eq('cliente_id', data.parent_cliente_id)
      .eq('status', 'ativo')
      .maybeSingle();
    if (parent) ids.add(parent.cliente_id);
  }

  // Se este cliente é pai de contas filhas ativas (ex: REALIZACOES_GONZAGA -> GONZAGA_AMST, GONZAGA_SCA_181)
  const { data: children } = await supabaseAdmin
    .from('clientes')
    .select('cliente_id')
    .eq('parent_cliente_id', data.cliente_id)
    .eq('status', 'ativo');

  for (const c of (children || [])) {
    ids.add(c.cliente_id);
  }

  return Array.from(ids);
}

/**
 * PostgREST corta respostas em ~1000 linhas. Sem paginar, os totais ficam
 * silenciosamente menores que o real. Esta função percorre todas as páginas.
 */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const pageSize = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

export function indisponivel(err: unknown) {
  const motivo = err instanceof Error ? err.message : 'erro desconhecido';
  return { success: false, disponivel: false, motivo: `Fonte painel indisponível: ${motivo}` };
}
