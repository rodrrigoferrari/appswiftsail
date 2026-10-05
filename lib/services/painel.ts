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
    .select('cliente_id, status')
    .eq('cliente_id', clienteId.toUpperCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status !== 'ativo') return null;
  return [data.cliente_id];
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
