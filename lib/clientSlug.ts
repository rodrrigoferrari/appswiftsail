import { Cliente } from '@/types/database';

/**
 * Converte qualquer texto para um slug amigável em URLs.
 * Remove acentos, caracteres especiais e substitui espaços/sublinhados por hífens.
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // substitui caracteres não-alfanuméricos por hífen
    .replace(/^-+|-+$/g, ''); // remove hífens das extremidades
}

/**
 * Retorna o slug canônico para um cliente.
 * Prefere o nome do cliente (ex: "Realizações Gonzaga" -> "realizacoes-gonzaga"),
 * ou o cliente_id (ex: "REALIZACOES_GONZAGA" -> "realizacoes-gonzaga").
 */
export function getClientSlug(client: Cliente): string {
  if (!client) return '';
  if (client.nome) {
    return slugify(client.nome);
  }
  return slugify(client.cliente_id);
}

/**
 * Busca e resolve um cliente na lista a partir de qualquer identificador passado na URL.
 * Suporta:
 * 1. Slug amigável do cliente_id (ex: "realizacoes-gonzaga")
 * 2. Slug amigável do nome (ex: "realizacoes-gonzaga")
 * 3. cliente_id exato maiúsculo ou minúsculo (ex: "REALIZACOES_GONZAGA", "realizacoes_gonzaga")
 * 4. Correspondência parcial / substring (ex: "gonzaga", "genova", "adriatica")
 */
export function findClientBySlug(clients: Cliente[], slugOrId: string): Cliente | undefined {
  if (!slugOrId || !clients || clients.length === 0) return undefined;

  const raw = decodeURIComponent(slugOrId).trim();
  const normalized = slugify(raw);

  // 1. Tenta match exato no cliente_id (ignorando case)
  let found = clients.find((c) => c.cliente_id.toUpperCase() === raw.toUpperCase());
  if (found) return found;

  // 2. Tenta match no slug do cliente_id
  found = clients.find((c) => slugify(c.cliente_id) === normalized);
  if (found) return found;

  // 3. Tenta match no slug do nome
  found = clients.find((c) => slugify(c.nome) === normalized);
  if (found) return found;

  // 4. Tenta match sem hífens/underscores
  const stripped = normalized.replace(/-/g, '');
  found = clients.find((c) => {
    const cIdStripped = slugify(c.cliente_id).replace(/-/g, '');
    const cNomeStripped = slugify(c.nome).replace(/-/g, '');
    return cIdStripped === stripped || cNomeStripped === stripped;
  });
  if (found) return found;

  // 5. Fallback: match parcial por inclusão
  found = clients.find((c) => {
    const cIdSlug = slugify(c.cliente_id);
    const cNomeSlug = slugify(c.nome);
    return (
      (normalized.length >= 3 && cIdSlug.includes(normalized)) ||
      (normalized.length >= 3 && cNomeSlug.includes(normalized)) ||
      (cIdSlug.length >= 3 && normalized.includes(cIdSlug)) ||
      (cNomeSlug.length >= 3 && normalized.includes(cNomeSlug))
    );
  });

  return found;
}
